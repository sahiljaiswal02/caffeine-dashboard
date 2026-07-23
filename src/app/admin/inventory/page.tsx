"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { getImageUrl } from "@/lib/image-map";
import { migrateData } from "./migrateData";
import { Search, Package, ArrowLeft, LogOut, Coffee, Edit, Plus, Database, Trash2 } from "lucide-react";

export default function AdminInventory() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "cat1",
    isFeatured: false,
    preparationTime: "",
    image: "",
  });

  useEffect(() => {
    document.title = "Inventory Management | Admin";
  }, []);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (role === "admin") {
      const q = query(collection(db, "menuItems"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        itemsData.sort((a, b) => a.name.localeCompare(b.name));
        setItems(itemsData);
      });
      return () => unsubscribe();
    }
  }, [role]);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "menuItems", id), {
        isAvailable: !currentStatus,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability");
    }
  };

  const withTimeout = (promise: Promise<any>, ms: number, message: string) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      promise.then((res) => {
        clearTimeout(timer);
        resolve(res);
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "menuItems", itemToDelete.id));
      setItemToDelete(null);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      alert("Name and Price are required.");
      return;
    }
    try {
      setIsUploading(true);
      const id = `item_${Date.now()}`;
      const imageUrl = newItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760&auto=format&fit=crop";

      console.log("Saving to Firestore...");
      await withTimeout(
        setDoc(doc(db, "menuItems", id), {
          id,
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          categoryId: newItem.categoryId,
          isFeatured: newItem.isFeatured,
          preparationTime: parseInt(newItem.preparationTime) || 10,
          isAvailable: true,
          image: imageUrl,
          rating: 0,
        }),
        10000,
        "Database save timed out after 10 seconds. Check your Firestore rules."
      );
      
      console.log("Product saved successfully.");
      setShowAddModal(false);
      setNewItem({ name: "", description: "", price: "", categoryId: "cat1", isFeatured: false, preparationTime: "", image: "" });
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert("Failed to add product: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem.name || !editItem.price) {
      alert("Name and Price are required.");
      return;
    }
    try {
      setIsUploading(true);
      const imageUrl = editItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760&auto=format&fit=crop";

      console.log("Updating Firestore...");
      await withTimeout(
        updateDoc(doc(db, "menuItems", editItem.id), {
          name: editItem.name,
          description: editItem.description,
          price: parseFloat(editItem.price),
          categoryId: editItem.categoryId,
          isFeatured: editItem.isFeatured || false,
          preparationTime: parseInt(editItem.preparationTime) || 10,
          image: imageUrl,
        }),
        10000,
        "Database update timed out after 10 seconds. Check your Firestore rules."
      );
      
      console.log("Product updated successfully.");
      setShowEditModal(false);
      setEditItem(null);
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert("Failed to update product: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditItem({ ...item, price: item.price.toString(), preparationTime: (item.preparationTime || 10).toString() });
    setShowEditModal(true);
  };

  const handleMigrateMenu = async () => {
    try {
      alert("Migrating menu... Please wait.");
      for (const item of migrateData) {
        await setDoc(doc(db, "menuItems", item.id), item);
      }
      alert("Success! Menu migrated successfully.");
    } catch (error: any) {
      console.error("Migration error:", error);
      alert("Failed to migrate menu: " + error.message);
    }
  };

  if (loading || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.categoryId && item.categoryId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Package className="text-emerald-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Inventory Manager</h1>
            <p className="text-sm text-slate-500 font-medium">Control Item Availability</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleMigrateMenu}
            className="hidden px-4 py-2 flex-1 sm:flex-none justify-center bg-amber-50 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors shadow-sm items-center gap-2 border border-amber-200"
          >
            <Database className="w-4 h-4" /> Migrate
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 flex-1 sm:flex-none justify-center bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2 border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 flex-1 sm:flex-none justify-center bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 border border-emerald-700"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button
            onClick={() => auth.signOut()}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 mt-6 sm:mt-8 flex flex-col gap-6">
        
        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-all"
              placeholder="Search items or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 w-full sm:w-auto text-sm">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 flex-1 justify-center">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               <span className="font-bold text-slate-700">{items.filter(i => i.isAvailable !== false).length} Available</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 flex-1 justify-center">
               <span className="w-2 h-2 rounded-full bg-red-500"></span>
               <span className="font-bold text-slate-700">{items.filter(i => i.isAvailable === false).length} Sold Out</span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const isAvailable = item.isAvailable !== false;
            
            return (
              <div key={item.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${isAvailable ? 'border-slate-200 hover:shadow-md hover:border-emerald-200' : 'border-red-100 bg-red-50/10 opacity-75 grayscale-[0.2]'}`}>
                
                {/* Image Section */}
                <div className="w-full h-32 bg-slate-100 relative">
                  {item.image ? (
                    <img src={getImageUrl(item.image) || ""} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍔</div>
                  )}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm">
                    {item.categoryId}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight pr-2 flex-1">{item.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => toggleAvailability(item.id, isAvailable)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title={isAvailable ? "Mark Unavailable" : "Mark Available"}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 ml-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                    {item.description || "No description provided."}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                     <span className="font-black text-slate-900">₹{item.price}</span>
                     <span className={`text-xs font-bold px-2 py-1 rounded-md ${isAvailable ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                       {isAvailable ? 'In Stock' : 'Sold Out'}
                     </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center mt-4">
            <Coffee className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No items found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search query.</p>
          </div>
        )}

      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">✕</button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">Add New Product</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Fill in the details to add to inventory.</p>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900" placeholder="e.g. Classic Burger" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea required value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium min-h-[80px] resize-none text-slate-900" placeholder="Delicious classic burger..."></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-slate-900" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium appearance-none text-slate-900">
                    <option value="cat1">Shawarma</option>
                    <option value="cat2">Schezwan</option>
                    <option value="cat3">Egg</option>
                    <option value="cat4">Paneer</option>
                    <option value="cat5">Mutton</option>
                    <option value="cat6">Beverages</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input type="checkbox" id="featured" checked={newItem.isFeatured} onChange={e => setNewItem({...newItem, isFeatured: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                <label htmlFor="featured" className="text-sm font-bold text-gray-700 cursor-pointer">Mark as Featured Product</label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                <input type="url" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900" placeholder="https://..." />
                <p className="text-xs text-gray-400 mt-1.5">Paste an image link from the internet, or leave blank.</p>
              </div>

              <button disabled={isUploading} type="submit" className="w-full mt-4 bg-emerald-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center text-base">
                {isUploading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Product"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setShowEditModal(false); setEditItem(null); }} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">✕</button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">Edit Product</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Update inventory item details.</p>
            </div>
            
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                <input required type="text" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900" placeholder="e.g. Classic Burger" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea required value={editItem.description} onChange={e => setEditItem({...editItem, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium min-h-[80px] resize-none text-slate-900" placeholder="Delicious classic burger..."></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" value={editItem.price} onChange={e => setEditItem({...editItem, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-slate-900" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={editItem.categoryId} onChange={e => setEditItem({...editItem, categoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium appearance-none text-slate-900">
                    <option value="cat1">Shawarma</option>
                    <option value="cat2">Schezwan</option>
                    <option value="cat3">Egg</option>
                    <option value="cat4">Paneer</option>
                    <option value="cat5">Mutton</option>
                    <option value="cat6">Beverages</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input type="checkbox" id="edit-featured" checked={editItem.isFeatured || false} onChange={e => setEditItem({...editItem, isFeatured: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                <label htmlFor="edit-featured" className="text-sm font-bold text-gray-700 cursor-pointer">Mark as Featured Product</label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
                <input type="url" value={editItem.image} onChange={e => setEditItem({...editItem, image: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900" placeholder="https://..." />
                <p className="text-xs text-gray-400 mt-1.5">Paste a valid image link from the internet.</p>
              </div>

              <button disabled={isUploading} type="submit" className="w-full mt-4 bg-emerald-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center text-base">
                {isUploading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Product"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transform transition-all scale-100 opacity-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Product?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete <span className="font-bold text-gray-700">"{itemToDelete.name}"</span>? This action cannot be undone and it will be removed from all menus.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
