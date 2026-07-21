"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminDashboard() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Dashboard | Shawarma 365";
  }, []);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (role === "admin") {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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

  // Derived metrics
  const {
    totalRevenue,
    monthlyRevenue,
    dailyRevenue,
    upiRevenue,
    cashRevenue,
    topProductToday,
    kitchenStatus,
    ordersToday,
    ordersThisMonth
  } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let totalRev = 0;
    let monthlyRev = 0;
    let dailyRev = 0;
    let upiRev = 0;
    let cashRev = 0;
    
    let oToday = 0;
    let oThisMonth = 0;

    const productCounts: Record<string, { count: number, name: string }> = {};
    
    const kitchen = {
      pending: 0,
      preparing: 0,
      ready: 0
    };

    orders.forEach((order) => {
      // Use order.total instead of order.totalAmount
      const amount = order.total || 0;
      const orderDate = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.parse(order.createdAt) || 0).getTime();
      
      const isToday = orderDate >= today;
      const isThisMonth = orderDate >= thisMonth;

      totalRev += amount;
      
      if (isThisMonth) {
        monthlyRev += amount;
        oThisMonth++;
      }
      
      if (isToday) {
        dailyRev += amount;
        oToday++;
        
        // Product counts for today
        order.items?.forEach((cartItem: any) => {
          const itemName = cartItem.item?.name;
          if (itemName) {
            if (!productCounts[itemName]) productCounts[itemName] = { count: 0, name: itemName };
            productCounts[itemName].count += (cartItem.quantity || 1);
          }
        });
      }

      if (order.paymentMethod === "upi") upiRev += amount;
      if (order.paymentMethod === "cash") cashRev += amount;

      if (order.status === "pending") kitchen.pending++;
      if (order.status === "preparing") kitchen.preparing++;
      if (order.status === "ready") kitchen.ready++;
    });

    // Find top product
    let topProduct = { name: "No orders yet", count: 0 };
    Object.values(productCounts).forEach((p) => {
      if (p.count > topProduct.count) topProduct = p;
    });

    return {
      totalRevenue: totalRev,
      monthlyRevenue: monthlyRev,
      dailyRevenue: dailyRev,
      upiRevenue: upiRev,
      cashRevenue: cashRev,
      topProductToday: topProduct,
      kitchenStatus: kitchen,
      ordersToday: oToday,
      ordersThisMonth: oThisMonth
    };
  }, [orders]);

  if (loading || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : Date.parse(timestamp) || 0);
    return date.toLocaleString('en-IN', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
      case "preparing": return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">Preparing</span>;
      case "ready": return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider">Ready</span>;
      case "delivered": return <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    doc.setFontSize(20);
    doc.text(`Monthly Sales Report - ${monthYear}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Filter orders for this month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.parse(order.createdAt) || 0).getTime();
      return orderDate >= thisMonthStart;
    });

    const totalRev = monthlyOrders.reduce((acc, order) => acc + (order.total || 0), 0);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Orders: ${monthlyOrders.length}`, 14, 40);
    doc.text(`Total Revenue: Rs. ${totalRev.toLocaleString('en-IN')}`, 14, 46);

    const tableColumn = ["Order ID", "Date", "Items", "Payment", "Amount", "Status"];
    const tableRows: any[] = [];

    monthlyOrders.forEach(order => {
      const date = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.parse(order.createdAt) || 0);
      const dateStr = date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      
      const itemDetails = order.items?.map((cartItem: any) => {
        let detailStr = `${cartItem.quantity || 1}x ${cartItem.item?.name}`;
        const extras = [];
        if (cartItem.selectedBread) extras.push(`Bread: ${cartItem.selectedBread}`);
        if (cartItem.selectedAddons?.length > 0) extras.push(`Add-ons: ${cartItem.selectedAddons.map((a:any) => a.name).join(", ")}`);
        if (cartItem.specialInstructions) extras.push(`Note: ${cartItem.specialInstructions}`);
        
        if (extras.length > 0) {
          detailStr += `\n   ${extras.join(" | ")}`;
        }
        return detailStr;
      }).join("\n") || "No items";
      
      const rowData = [
        `#${order.id.slice(-5).toUpperCase()}`,
        dateStr,
        itemDetails,
        order.paymentMethod ? order.paymentMethod.toUpperCase() : "N/A",
        `Rs. ${order.total || 0}`,
        order.status.toUpperCase()
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo 600
    });

    doc.save(`Sales_Report_${monthYear.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Analytics & Business Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/cook")}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm"
          >
            Kitchen Display
          </button>
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        
        {/* Top Tier Metrics - Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Daily Revenue</h3>
              <p className="mt-2 text-4xl font-black text-gray-900">{formatCurrency(dailyRevenue)}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-green-600">
                <span>{ordersToday} orders today</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Monthly Revenue</h3>
              <p className="mt-2 text-4xl font-black text-gray-900">{formatCurrency(monthlyRevenue)}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                <span>{ordersThisMonth} orders this month</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-5 rounded-bl-full"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lifetime Revenue</h3>
              <p className="mt-2 text-4xl font-black text-white">{formatCurrency(totalRevenue)}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-gray-400">
                <span>{orders.length} total lifetime orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Middle Tier - Payment Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              Payment Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700">UPI</span>
                </div>
                <span className="font-bold text-gray-900 text-lg">{formatCurrency(upiRevenue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700">Cash</span>
                </div>
                <span className="font-bold text-gray-900 text-lg">{formatCurrency(cashRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Middle Tier - Kitchen & Top Products */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100">
              <h3 className="text-lg font-bold text-orange-900 mb-6 flex items-center gap-2">
                Top Product Today
              </h3>
              <div className="flex flex-col items-center justify-center h-32 text-center">
                {topProductToday.count > 0 ? (
                  <>
                    <p className="text-2xl font-black text-orange-950 leading-tight">{topProductToday.name}</p>
                    <p className="mt-2 text-orange-700 font-bold bg-orange-200/50 px-4 py-1 rounded-full">
                      {topProductToday.count} units sold
                    </p>
                  </>
                ) : (
                  <p className="text-orange-800 font-medium">No sales yet today</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                Kitchen Queue
              </h3>
              <div className="flex justify-between items-end h-32 pb-2">
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-full bg-orange-100 rounded-t-lg relative flex justify-center items-end" style={{ height: `${Math.max(20, Math.min(100, kitchenStatus.pending * 10))}%` }}>
                    <span className="absolute -top-6 font-bold text-orange-600">{kitchenStatus.pending}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Pending</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-full bg-blue-100 rounded-t-lg relative flex justify-center items-end" style={{ height: `${Math.max(20, Math.min(100, kitchenStatus.preparing * 10))}%` }}>
                    <span className="absolute -top-6 font-bold text-blue-600">{kitchenStatus.preparing}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Prep</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-full bg-purple-100 rounded-t-lg relative flex justify-center items-end" style={{ height: `${Math.max(20, Math.min(100, kitchenStatus.ready * 10))}%` }}>
                    <span className="absolute -top-6 font-bold text-purple-600">{kitchenStatus.ready}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Recent Orders
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-500">Showing latest {Math.min(orders.length, 15)}</span>
              <button 
                onClick={generatePDF}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Export Monthly Report
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 15).map((order) => {
                  const itemCount = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0;
                  const isExpanded = expandedOrderId === order.id;
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          #{order.id.slice(-5).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700 uppercase">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                          {formatCurrency(order.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end items-center gap-3">
                          {getStatusBadge(order.status)}
                          <span className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                              <h4 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Order Details</h4>
                              <ul className="space-y-3">
                                {order.items?.map((cartItem: any, idx: number) => (
                                  <li key={idx} className="text-sm flex justify-between items-start">
                                    <div className="flex items-start">
                                      <span className="bg-gray-800 text-white rounded px-2 py-0.5 text-xs font-bold mr-3 mt-0.5">
                                        {cartItem.quantity}x
                                      </span>
                                      <div>
                                        <span className="font-semibold text-gray-800 text-base">{cartItem.item?.name}</span>
                                        
                                        {(cartItem.selectedBread || (cartItem.selectedAddons && cartItem.selectedAddons.length > 0)) && (
                                          <div className="mt-1 pl-1 border-l-2 border-gray-200 text-gray-500 text-xs space-y-1">
                                            {cartItem.selectedBread && <div>Bread: {cartItem.selectedBread}</div>}
                                            {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                                              <div>Add-ons: {cartItem.selectedAddons.map((a: any) => a.name).join(", ")}</div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {cartItem.specialInstructions && (
                                          <div className="mt-1.5 bg-red-50 text-red-700 p-2 rounded text-xs font-medium border border-red-100 flex items-start">
                                            <span>Note: {cartItem.specialInstructions}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold text-gray-600">
                                      {formatCurrency(cartItem.item?.price * cartItem.quantity)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {order.tableNumber && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                                  <span className="text-gray-500">Dining Option</span>
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                                    Table {order.tableNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-medium">
                No orders have been placed yet.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
