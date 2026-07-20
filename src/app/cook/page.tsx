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
      <div key={order.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${isCompleted ? 'border-gray-200 opacity-75' : 'border-gray-200'} mb-4 flex flex-col`}>
        {/* Ticket Header */}
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
          <div>
            <div className="text-sm text-gray-500 font-medium">#{order.id.slice(-5).toUpperCase()}</div>
            <div className="text-xs text-gray-400 mt-1">{formatTime(order.createdAt)}</div>
          </div>
          {order.tableNumber ? (
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
              Table {order.tableNumber}
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              Takeaway
            </div>
          )}
        </div>

        {/* Ticket Body - Items */}
        <div className="flex-1 mb-4">
          <ul className="space-y-3">
            {order.items?.map((cartItem: any, idx: number) => (
              <li key={idx} className="text-sm">
                <div className="flex items-start">
                  <span className="bg-gray-800 text-white rounded px-2 py-0.5 text-xs font-bold mr-2 mt-0.5">
                    {cartItem.quantity}x
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-800 text-base">{cartItem.item?.name}</span>
                    
                    {(cartItem.selectedBread || (cartItem.selectedAddons && cartItem.selectedAddons.length > 0)) && (
                      <div className="mt-1 pl-1 border-l-2 border-gray-200 text-gray-500 text-xs space-y-1">
                        {cartItem.selectedBread && <div>🥖 Bread: {cartItem.selectedBread}</div>}
                        {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                          <div>➕ {cartItem.selectedAddons.map((a: any) => a.name).join(", ")}</div>
                        )}
                      </div>
                    )}
                    
                    {cartItem.specialInstructions && (
                      <div className="mt-1.5 bg-red-50 text-red-700 p-2 rounded text-xs font-medium border border-red-100 flex items-start">
                        <span className="mr-1">⚠️</span>
                        <span>{cartItem.specialInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticket Footer - Actions */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {columnStatus === "pending" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "preparing")}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <span>👨‍🍳 Start Preparing</span>
            </button>
          )}
          {columnStatus === "preparing" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "ready")}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <span>🔔 Mark as Ready</span>
            </button>
          )}
          {columnStatus === "ready" && (
            <button 
              onClick={() => updateOrderStatus(order.id, "delivered")}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <span>✅ Complete Order</span>
            </button>
          )}
          {columnStatus === "delivered" && (
            <div className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-center text-sm flex justify-center items-center gap-2">
              <span>🎉 Completed</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Kitchen Display System</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Live Order Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live
          </div>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-[calc(100vh-120px)]">
          
          {/* Column 1: New Orders */}
          <div className="w-[350px] flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-100 rounded-t-2xl flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="text-lg">📥</span> New Orders
              </h2>
              <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {orders.filter(o => o.status === "pending").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "pending").map(order => renderTicket(order, "pending"))}
              {orders.filter(o => o.status === "pending").length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                  <div className="text-4xl opacity-50">☕️</div>
                  <p className="text-sm font-medium">No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="w-[350px] flex flex-col bg-orange-50/30 rounded-2xl border border-orange-100">
            <div className="p-4 border-b border-orange-100 bg-orange-50/50 rounded-t-2xl flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-orange-800 flex items-center gap-2">
                <span className="text-lg">🔥</span> Preparing
              </h2>
              <span className="bg-white text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {orders.filter(o => o.status === "preparing").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "preparing").map(order => renderTicket(order, "preparing"))}
            </div>
          </div>

          {/* Column 3: Ready */}
          <div className="w-[350px] flex flex-col bg-blue-50/30 rounded-2xl border border-blue-100">
            <div className="p-4 border-b border-blue-100 bg-blue-50/50 rounded-t-2xl flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-blue-800 flex items-center gap-2">
                <span className="text-lg">🛍️</span> Ready for Pickup
              </h2>
              <span className="bg-white text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {orders.filter(o => o.status === "ready").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {orders.filter(o => o.status === "ready").map(order => renderTicket(order, "ready"))}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="w-[350px] flex flex-col bg-green-50/30 rounded-2xl border border-green-100">
            <div className="p-4 border-b border-green-100 bg-green-50/50 rounded-t-2xl flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-green-800 flex items-center gap-2">
                <span className="text-lg">✨</span> Completed
              </h2>
              <span className="bg-white text-green-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {orders.filter(o => o.status === "delivered").length}
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {/* Show most recent completed first by reversing */}
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
