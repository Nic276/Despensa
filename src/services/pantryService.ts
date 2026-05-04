import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { PantryItem, Movement, ShoppingItem } from '../types';

const getItemsPath = () => `users/${auth.currentUser?.uid}/items`;
const getMovementsPath = () => `users/${auth.currentUser?.uid}/movements`;
const getShoppingListPath = () => `users/${auth.currentUser?.uid}/shoppingList`;

export const pantryService = {
  async getItems(): Promise<PantryItem[]> {
    const path = getItemsPath();
    try {
      const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addItem(item: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const path = getItemsPath();
    const shoppingListPath = getShoppingListPath();
    const movementsPath = getMovementsPath();
    
    try {
      const batch = writeBatch(db);
      
      // Check for duplicates
      const qExist = query(collection(db, path), where('name', '==', item.name));
      const existSnap = await getDocs(qExist);
      
      let finalDocRef;
      let newTotalStock = item.stock;

      if (!existSnap.empty) {
        // Update existing
        const existingDoc = existSnap.docs[0];
        const existingData = existingDoc.data() as PantryItem;
        finalDocRef = existingDoc.ref;
        newTotalStock = existingData.stock + item.stock;

        // Manage batches
        let batches = existingData.batches || [];
        if (item.expirationDate) {
          const existingBatch = batches.find(b => b.date === item.expirationDate);
          if (existingBatch) {
            existingBatch.quantity += item.stock;
          } else {
            batches.push({ date: item.expirationDate, quantity: item.stock });
          }
        } else {
          // If no date, add to a "Sin fecha" batch or similar
          const existingBatch = batches.find(b => b.date === '');
          if (existingBatch) {
            existingBatch.quantity += item.stock;
          } else {
            batches.push({ date: '', quantity: item.stock });
          }
        }

        // Sort batches by date and update main expirationDate
        batches = batches.filter(b => b.quantity > 0).sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });

        batch.update(finalDocRef, {
          stock: newTotalStock,
          batches,
          expirationDate: batches.length > 0 ? (batches.find(b => b.date) || batches[0]).date : null,
          updatedAt: serverTimestamp()
        });

        // Record movement for the update
        const movementDoc = doc(collection(db, movementsPath));
        batch.set(movementDoc, {
          itemId: existingDoc.id,
          type: 'ingreso',
          quantity: item.stock,
          previousStock: existingData.stock,
          newStock: newTotalStock,
          timestamp: serverTimestamp()
        });
      } else {
        // Create new
        finalDocRef = doc(collection(db, path));
        const batches = item.expirationDate 
          ? [{ date: item.expirationDate, quantity: item.stock }]
          : [{ date: '', quantity: item.stock }];

        batch.set(finalDocRef, {
          ...item,
          batches,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Unified Logic: Sync shopping list based on new total stock level
      const targetStock = item.minStock * 2;
      const qShopping = query(
        collection(db, shoppingListPath), 
        where('name', '==', item.name)
      );
      const shoppingSnapshot = await getDocs(qShopping);

      if (newTotalStock > item.minStock) {
        // Remove from list if now stable
        shoppingSnapshot.forEach(doc => batch.delete(doc.ref));
      } else {
        // Add or update missing quantity
        const required = Math.max(1, targetStock - newTotalStock);
        if (shoppingSnapshot.empty) {
          const newShoppingDoc = doc(collection(db, shoppingListPath));
          batch.set(newShoppingDoc, {
            name: item.name,
            requiredQuantity: required,
            isChecked: false,
            createdAt: serverTimestamp()
          });
        } else {
          shoppingSnapshot.forEach(doc => batch.update(doc.ref, { 
            requiredQuantity: required 
          }));
        }
      }

      await batch.commit();
      return finalDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateStock(itemId: string, newStock: number, type: 'ingreso' | 'retiro', quantity: number, date?: string): Promise<void> {
    const path = getItemsPath();
    const itemDoc = doc(db, path, itemId);
    const movementsPath = getMovementsPath();
    const movementDoc = doc(collection(db, movementsPath));
    const shoppingListPath = getShoppingListPath();
    
    try {
      const batch = writeBatch(db);
      
      const itemSnap = await getDoc(itemDoc);
      if (!itemSnap.exists()) throw new Error('Item does not exist');
      const itemData = itemSnap.data() as PantryItem;
      const oldStock = itemData.stock;

      let batches = [...(itemData.batches || [])];

      if (type === 'ingreso') {
        const targetDate = date || '';
        const existingBatch = batches.find(b => b.date === targetDate);
        if (existingBatch) {
          existingBatch.quantity += quantity;
        } else {
          batches.push({ date: targetDate, quantity });
        }
      } else {
        // FIFO for withdrawals
        let remainingToSubtract = quantity;
        // Priority: sorted by date (earliest first), empty date last
        batches.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });

        for (let i = 0; i < batches.length && remainingToSubtract > 0; i++) {
          const b = batches[i];
          if (date && b.date !== date) continue; // Skip if specific date requested and doesn't match

          if (b.quantity >= remainingToSubtract) {
            b.quantity -= remainingToSubtract;
            remainingToSubtract = 0;
          } else {
            remainingToSubtract -= b.quantity;
            b.quantity = 0;
          }
        }
      }

      // Cleanup zero-quantity batches
      batches = batches.filter(b => b.quantity > 0);
      // Re-sort
      batches.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });

      batch.update(itemDoc, {
        stock: newStock,
        batches,
        expirationDate: batches.length > 0 ? (batches.find(b => b.date) || batches[0]).date : null,
        updatedAt: serverTimestamp()
      });

      batch.set(movementDoc, {
        itemId,
        type,
        quantity,
        previousStock: oldStock,
        newStock,
        timestamp: serverTimestamp()
      });

      // Unified Logic: Sync shopping list based on new stock level
      const targetStock = itemData.minStock * 2;
      const q = query(
        collection(db, shoppingListPath), 
        where('name', '==', itemData.name)
      );
      const shoppingSnapshot = await getDocs(q);

      if (newStock > itemData.minStock) {
        // Remove from list if now stable
        shoppingSnapshot.forEach(doc => batch.delete(doc.ref));
      } else {
        // Add or update missing quantity
        const required = Math.max(1, targetStock - newStock);
        if (shoppingSnapshot.empty) {
          const newShoppingDoc = doc(collection(db, shoppingListPath));
          batch.set(newShoppingDoc, {
            name: itemData.name,
            requiredQuantity: required,
            isChecked: false,
            createdAt: serverTimestamp()
          });
        } else {
          shoppingSnapshot.forEach(doc => batch.update(doc.ref, { 
            requiredQuantity: required 
          }));
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async deleteItem(itemId: string): Promise<void> {
    const path = getItemsPath();
    const shoppingListPath = getShoppingListPath();
    try {
      const itemDoc = doc(db, path, itemId);
      const itemSnap = await getDoc(itemDoc);
      
      if (itemSnap.exists()) {
        const itemData = itemSnap.data() as PantryItem;
        const q = query(
          collection(db, shoppingListPath), 
          where('name', '==', itemData.name)
        );
        const shoppingSnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        batch.delete(itemDoc);
        shoppingSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${itemId}`);
      throw error;
    }
  },

  async updateItem(itemId: string, data: Partial<PantryItem>): Promise<void> {
    const path = getItemsPath();
    const shoppingListPath = getShoppingListPath();
    try {
      const itemDoc = doc(db, path, itemId);
      const batch = writeBatch(db);
      
      const itemSnap = await getDoc(itemDoc);
      if (!itemSnap.exists()) return;
      const existingData = itemSnap.data() as PantryItem;
      
      batch.update(itemDoc, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // If minStock or name changed, we may need to sync shopping list
      if (data.minStock !== undefined || data.name !== undefined) {
        const newName = data.name || existingData.name;
        const newMinStock = data.minStock !== undefined ? data.minStock : existingData.minStock;
        const currentStock = existingData.stock;
        
        // Handle name change (cleanup old shopping entry)
        if (data.name && data.name !== existingData.name) {
          const qOld = query(collection(db, shoppingListPath), where('name', '==', existingData.name));
          const oldSnap = await getDocs(qOld);
          oldSnap.forEach(doc => batch.delete(doc.ref));
        }

        const qNew = query(collection(db, shoppingListPath), where('name', '==', newName));
        const newSnap = await getDocs(qNew);
        
        const targetStock = newMinStock * 2;
        if (currentStock > newMinStock) {
          newSnap.forEach(doc => batch.delete(doc.ref));
        } else {
          const required = Math.max(1, targetStock - currentStock);
          if (newSnap.empty) {
            const newShoppingDoc = doc(collection(db, shoppingListPath));
            batch.set(newShoppingDoc, {
              name: newName,
              requiredQuantity: required,
              isChecked: false,
              createdAt: serverTimestamp()
            });
          } else {
            newSnap.forEach(doc => batch.update(doc.ref, { 
              name: newName,
              requiredQuantity: required 
            }));
          }
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${itemId}`);
      throw error;
    }
  },

  async getShoppingList(): Promise<ShoppingItem[]> {
    const path = getShoppingListPath();
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async toggleShoppingItem(id: string, isChecked: boolean): Promise<void> {
    const path = getShoppingListPath();
    try {
      await updateDoc(doc(db, path, id), { isChecked });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
      throw error;
    }
  },

  async getMovements(): Promise<Movement[]> {
    const path = getMovementsPath();
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};
