"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getImageUrl } from "@/lib/image-map";
import { Search, Package, ArrowLeft, LogOut, Coffee, Edit, X, Save } from "lucide-react";

export default function CookInventory() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    categoryId: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Inventory Management | Shawarma365";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (!loading && user && role !== "cook" && role !== "admin") {
      router.push("/");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (role === "cook" || role === "admin") {
      const q = query(collection(db, "menuItems"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        // Sort alphabetically by default
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

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || 0,
      imageUrl: item.imageUrl || "",
      categoryId: item.categoryId || ""
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "menuItems", editingItem.id), {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        imageUrl: editForm.imageUrl,
        categoryId: editForm.categoryId
      });
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || (!["admin", "cook"].includes(role as string))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Package className="text-orange-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Inventory Manager</h1>
            <p className="text-sm text-slate-500 font-medium">Control Item Availability</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push(role === "admin" ? "/admin" : "/cook")}
            className="px-4 py-2 flex-1 sm:flex-none justify-center bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2 border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
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
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm shadow-sm transition-all"
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
              <div key={item.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${isAvailable ? 'border-slate-200 hover:shadow-md hover:border-orange-200' : 'border-red-100 bg-red-50/10 opacity-75 grayscale-[0.2]'}`}>
                
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => toggleAvailability(item.id, isAvailable)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isAvailable ? 'bg-orange-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      {role === "admin" && (
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                          title="Edit Item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                    {item.description || "No description provided."}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                     <span className="font-black text-slate-900">₹{item.price}</span>
                     <span className={`text-xs font-bold px-2 py-1 rounded-md ${isAvailable ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50'}`}>
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

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-500" /> Edit Product
              </h2>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="editForm" onSubmit={handleSaveEdit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Image URL</label>
                  <input 
                    type="url" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})}
                    placeholder="https://..."
                  />
                  {editForm.imageUrl && (
                    <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 items-center">
                      <img src={editForm.imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <span className="text-xs text-slate-500 font-medium">Image Preview</span>
                    </div>
                  )}
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="editForm"
                disabled={isSaving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
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
