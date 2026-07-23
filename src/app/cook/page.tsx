"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { ChefHat, CheckCircle2, Clock, PlayCircle, LogOut, Package, ArrowLeft } from "lucide-react";

type Tab = "pending" | "preparing" | "ready" | "delivered";

export default function CookDashboard() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  useEffect(() => {
    document.title = "Kitchen Dashboard | Shawarma365";
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
      const q = query(
        collection(db, "orders"),
        where("status", "in", ["pending", "preparing", "ready", "delivered"]),
        orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
      });
      return () => unsubscribe();
    }
  }, [role]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : Date.parse(timestamp) || Date.now());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || (!["admin", "cook"].includes(role as string))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const renderTicket = (order: any, columnStatus: string) => {
    const isCompleted = order.status === "delivered";
    
    return (
      <div key={order.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 mb-4 flex flex-col ${isCompleted ? 'opacity-60' : ''}`}>
        {/* Ticket Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="text-sm font-black text-slate-900">#{order.id.slice(-5).toUpperCase()}</div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> {formatTime(order.createdAt)}
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${order.tableNumber ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
          </div>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 mb-5">
          <ul className="space-y-4">
            {order.items?.map((cartItem: any, idx: number) => (
              <li key={idx} className="text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-slate-100 text-slate-800 rounded-md px-2 py-1 text-xs font-black min-w-[28px] text-center border border-slate-200">
                    {cartItem.quantity}x
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-base">{cartItem.item?.name}</span>
                    
                    {(cartItem.selectedBread || (cartItem.selectedAddons && cartItem.selectedAddons.length > 0)) && (
                      <div className="mt-2 pl-3 border-l-2 border-orange-200 text-slate-600 text-xs space-y-1">
                        {cartItem.selectedBread && <div className="font-medium flex items-center gap-1"><span className="text-orange-500">•</span> {cartItem.selectedBread}</div>}
                        {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                          <div className="font-medium flex items-center gap-1"><span className="text-orange-500">+</span> {cartItem.selectedAddons.map((a: any) => a.name).join(", ")}</div>
                        )}
                      </div>
                    )}
                    
                    {cartItem.specialInstructions && (
                      <div className="mt-2 bg-yellow-50 text-yellow-800 px-3 py-2 rounded-md text-xs font-medium border border-yellow-100 flex items-start gap-2">
                        <span className="font-bold">Note:</span> {cartItem.specialInstructions}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticket Actions */}
        <div className="mt-auto">
          {columnStatus === "pending" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "preparing")}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-orange-500/20"
            >
              <PlayCircle className="w-5 h-5" /> Start Preparing
            </button>
          )}
          {columnStatus === "preparing" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "ready")}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-blue-500/20"
            >
              <CheckCircle2 className="w-5 h-5" /> Mark as Ready
            </button>
          )}
          {columnStatus === "ready" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "delivered")}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-emerald-500/20"
            >
              <Package className="w-5 h-5" /> Complete Order
            </button>
          )}
          {columnStatus === "delivered" && (
            <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-center text-sm border border-slate-200">
              ✓ Completed
            </div>
          )}
        </div>
      </div>
    );
  };

  const getColumnCounts = () => ({
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  });
  
  const counts = getColumnCounts();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <ChefHat className="text-orange-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Kitchen Display System</h1>
            <p className="text-sm text-slate-500 font-medium">Live Order Management</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </button>
          )}
          <button
            onClick={() => router.push("/cook/inventory")}
            className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-200 flex items-center gap-2 flex-1 justify-center sm:flex-none"
          >
            <Package className="w-4 h-4" /> Inventory
          </button>
          <button
            onClick={() => auth.signOut()}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-[80px] z-20 flex px-2 py-2 gap-2 overflow-x-auto custom-scrollbar shadow-sm">
        {(["pending", "preparing", "ready", "delivered"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === tab 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tab === "ready" ? "Ready" : tab}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        {/* Mobile Single Column View */}
        <div className="md:hidden h-full overflow-y-auto custom-scrollbar pb-10">
           {orders.filter(o => o.status === activeTab).map(order => renderTicket(order, activeTab))}
           {orders.filter(o => o.status === activeTab).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <ChefHat className="w-12 h-12 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-wider">No {activeTab} orders</p>
              </div>
           )}
        </div>

        {/* Desktop 4-Column View */}
        <div className="hidden md:grid grid-cols-4 gap-6 h-full">
          
          {/* Column 1: New Orders */}
          <div className="flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">New Orders</h2>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md border border-orange-200">
                {counts.pending}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {orders.filter(o => o.status === "pending").map(order => renderTicket(order, "pending"))}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Preparing</h2>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md border border-blue-200">
                {counts.preparing}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {orders.filter(o => o.status === "preparing").map(order => renderTicket(order, "preparing"))}
            </div>
          </div>

          {/* Column 3: Ready */}
          <div className="flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Ready</h2>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-200">
                {counts.ready}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {orders.filter(o => o.status === "ready").map(order => renderTicket(order, "ready"))}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Completed</h2>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md border border-slate-200">
                {counts.delivered}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {orders.filter(o => o.status === "delivered").reverse().map(order => renderTicket(order, "delivered"))}
            </div>
          </div>

        </div>
      </main>
      
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
