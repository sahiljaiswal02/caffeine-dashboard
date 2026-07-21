"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { migrateData } from "./migrateData";

export default function AdminInventory() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "cat1",
    isFeatured: false,
    preparationTime: "",
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
        }));
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      alert("Name and Price are required.");
      return;
    }

    try {
      setIsUploading(true);
      const id = `item_${Date.now()}`;
      let imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760&auto=format&fit=crop";

      if (imageFile) {
        const imageRef = ref(storage, `menu-images/${id}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await setDoc(doc(db, "menuItems", id), {
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
      });
      setShowAddModal(false);
      setImageFile(null);
      setNewItem({ name: "", description: "", price: "", categoryId: "cat1", isFeatured: false, preparationTime: "" });
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert("Failed to add product: " + error.message);
    } finally {
      setIsUploading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-5 shadow-sm sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-900 to-emerald-600">Inventory Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage Menu Items Availability</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleMigrateMenu}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors shadow-sm"
          >
            Run Data Migration
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
          >
            Dashboard
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            + Add New Product
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8">
          <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shadow-sm border border-gray-200">🍔</div>
                          )}
                          <div>
                            <div className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{item.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {item.categoryId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-gray-900 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg inline-block">
                          ₹{item.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleAvailability(item.id, item.isAvailable !== false)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            item.isAvailable !== false ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className="sr-only">Toggle Availability</span>
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                              item.isAvailable !== false ? 'translate-x-8' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-sm border border-gray-200 shrink-0">🍔</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-gray-900 truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-black text-gray-900 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                        ₹{item.price}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                        {item.categoryId}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item.id, item.isAvailable !== false)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                        item.isAvailable !== false ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className="sr-only">Toggle Availability</span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                          item.isAvailable !== false ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="p-16 text-center text-gray-400 font-bold uppercase tracking-wider flex flex-col items-center gap-4">
                <span className="text-4xl opacity-50">📦</span>
                No items found. Please run the migration script.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white relative">
            <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">✕</button>
            
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900">Add New Product</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Fill in the details to add to inventory.</p>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium" placeholder="e.g. Classic Burger" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea required value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium min-h-[100px] resize-none" placeholder="Delicious classic burger..."></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-emerald-700" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium appearance-none">
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Image</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-emerald-600">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-400">{imageFile ? imageFile.name : 'SVG, PNG, JPG or GIF'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <button disabled={isUploading} type="submit" className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3.5 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center text-lg">
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
    </div>
  );
}
