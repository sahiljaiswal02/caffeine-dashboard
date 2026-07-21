"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function CookDashboard() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Cook Dashboard | Shawarma 365";
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderTicket = (order: any, columnStatus: string) => {
    const isCompleted = order.status === "delivered";
    
    return (
      <div key={order.id} className={`bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md hover:border-indigo-100 transition-all duration-300 ${isCompleted ? 'border-gray-200 opacity-70' : 'border-gray-100'} mb-4 flex flex-col group`}>
        {/* Ticket Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
          <div>
            <div className="text-sm text-gray-900 font-black">#{order.id.slice(-5).toUpperCase()}</div>
            <div className="text-xs text-gray-400 mt-1 font-medium">{formatTime(order.createdAt)}</div>
          </div>
          {order.tableNumber ? (
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-indigo-100">
              Table {order.tableNumber}
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-gray-100">
              Takeaway
            </div>
          )}
        </div>

        {/* Ticket Body - Items */}
        <div className="flex-1 mb-5">
          <ul className="space-y-4">
            {order.items?.map((cartItem: any, idx: number) => (
              <li key={idx} className="text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1 text-xs font-black shadow-sm border border-gray-200">
                    {cartItem.quantity}x
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 text-base leading-tight">{cartItem.item?.name}</span>
                    
                    {(cartItem.selectedBread || (cartItem.selectedAddons && cartItem.selectedAddons.length > 0)) && (
                      <div className="mt-2 pl-3 border-l-2 border-indigo-100 text-gray-500 text-xs space-y-1.5">
                        {cartItem.selectedBread && <div className="font-medium">🍞 {cartItem.selectedBread}</div>}
                        {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                          <div className="font-medium">➕ {cartItem.selectedAddons.map((a: any) => a.name).join(", ")}</div>
                        )}
                      </div>
                    )}
                    
                    {cartItem.specialInstructions && (
                      <div className="mt-2 bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-xs font-semibold border border-amber-100/50 flex items-start gap-1.5 shadow-sm">
                        <span>📝 {cartItem.specialInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticket Footer - Actions */}
        <div className="mt-auto">
          {columnStatus === "pending" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "preparing")}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-500/20 flex justify-center items-center gap-2 transform active:scale-[0.98]"
            >
              Start Preparing
            </button>
          )}
          {columnStatus === "preparing" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "ready")}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex justify-center items-center gap-2 transform active:scale-[0.98]"
            >
              Mark as Ready
            </button>
          )}
          {columnStatus === "ready" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "delivered")}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex justify-center items-center gap-2 transform active:scale-[0.98]"
            >
              Complete Order
            </button>
          )}
          {columnStatus === "delivered" && (
            <div className="w-full py-3 bg-gray-50/80 text-gray-400 rounded-xl font-bold text-center text-sm flex justify-center items-center gap-2 border border-gray-100">
              ✓ Completed
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">Kitchen Display System</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Live Order Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live
          </div>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={() => router.push("/cook/inventory")}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm"
          >
            Inventory
          </button>
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Column 1: New Orders */}
          <div className="flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] xl:h-[calc(100vh-160px)]">
            <div className="p-4 border-b border-slate-200 bg-white/50 rounded-t-2xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                New Orders
              </h2>
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-inner border border-slate-300/50">
                {orders.filter(o => o.status === "pending").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "pending").map(order => renderTicket(order, "pending"))}
              {orders.filter(o => o.status === "pending").length === 0 && (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2 opacity-50">
                  <p className="text-sm font-bold uppercase tracking-wider">No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="flex flex-col bg-orange-50/30 rounded-2xl border border-orange-100 shadow-sm min-h-[400px] xl:h-[calc(100vh-160px)]">
            <div className="p-4 border-b border-orange-100 bg-orange-50/80 rounded-t-2xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
              <h2 className="font-bold text-orange-900 flex items-center gap-2">
                Preparing
              </h2>
              <span className="bg-white text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-orange-200">
                {orders.filter(o => o.status === "preparing").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "preparing").map(order => renderTicket(order, "preparing"))}
            </div>
          </div>

          {/* Column 3: Ready */}
          <div className="flex flex-col bg-blue-50/30 rounded-2xl border border-blue-100 shadow-sm min-h-[400px] xl:h-[calc(100vh-160px)]">
            <div className="p-4 border-b border-blue-100 bg-blue-50/80 rounded-t-2xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
              <h2 className="font-bold text-blue-900 flex items-center gap-2">
                Ready for Pickup
              </h2>
              <span className="bg-white text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-blue-200">
                {orders.filter(o => o.status === "ready").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "ready").map(order => renderTicket(order, "ready"))}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="flex flex-col bg-emerald-50/30 rounded-2xl border border-emerald-100 shadow-sm min-h-[400px] xl:h-[calc(100vh-160px)]">
            <div className="p-4 border-b border-emerald-100 bg-emerald-50/80 rounded-t-2xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
              <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                Completed
              </h2>
              <span className="bg-white text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-emerald-200">
                {orders.filter(o => o.status === "delivered").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "delivered").reverse().map(order => renderTicket(order, "delivered"))}
            </div>
          </div>

        </div>
      </main>
      
      {/* Global styles for a thin custom scrollbar to make columns look cleaner */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}} />
    </div>
  );
}
