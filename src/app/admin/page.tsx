"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  TrendingUp,
  Wallet,
  Banknote,
  CalendarDays,
  Package,
  LayoutDashboard,
  LogOut,
  Download,
  ChefHat,
  CheckCircle2,
  PlayCircle,
  Clock,
} from "lucide-react";

export default function AdminDashboard() {
  const { role, loading, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Dashboard | Shawarma365";
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
    cashRevenue,
    topProductToday,
    kitchenStatus,
    ordersToday,
    ordersThisMonth,
  } = useMemo(() => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let totalRev = 0;
    let monthlyRev = 0;
    let dailyRev = 0;
    let cashRev = 0;

    let oToday = 0;
    let oThisMonth = 0;

    const productCounts: Record<string, { count: number; name: string }> = {};

    const kitchen = {
      pending: 0,
      preparing: 0,
      ready: 0,
    };

    orders.forEach((order) => {
      const amount = order.total || 0;
      const orderDate = new Date(
        order.createdAt?.seconds
          ? order.createdAt.seconds * 1000
          : Date.parse(order.createdAt) || 0,
      ).getTime();

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
            if (!productCounts[itemName])
              productCounts[itemName] = { count: 0, name: itemName };
            productCounts[itemName].count += cartItem.quantity || 1;
          }
        });
      }

      if (order.paymentMethod === "cash") cashRev += amount;

      if (order.status === "pending") kitchen.pending++;
      if (order.status === "preparing") kitchen.preparing++;
      if (order.status === "ready") kitchen.ready++;
    });

    let topProduct = { name: "No orders yet", count: 0 };
    Object.values(productCounts).forEach((p) => {
      if (p.count > topProduct.count) topProduct = p;
    });

    return {
      totalRevenue: totalRev,
      monthlyRevenue: monthlyRev,
      dailyRevenue: dailyRev,
      cashRevenue: cashRev,
      topProductToday: topProduct,
      kitchenStatus: kitchen,
      ordersToday: oToday,
      ordersThisMonth: oThisMonth,
    };
  }, [orders]);

  if (loading || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = new Date(
      timestamp.seconds ? timestamp.seconds * 1000 : Date.parse(timestamp) || 0,
    );
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-bold uppercase tracking-wider border border-slate-200">
            Pending
          </span>
        );
      case "preparing":
        return (
          <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-md text-xs font-bold uppercase tracking-wider border border-orange-200">
            Preparing
          </span>
        );
      case "ready":
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-bold uppercase tracking-wider border border-blue-200">
            Ready
          </span>
        );
      case "delivered":
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-bold uppercase tracking-wider border border-emerald-200">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-bold uppercase tracking-wider border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const clearOrders = async () => {
    if (window.confirm("Are you sure you want to delete ALL demo orders? This will reset all stats. This cannot be undone.")) {
      try {
        const q = query(collection(db, "orders"));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, "orders", docSnap.id)));
        await Promise.all(deletePromises);
        alert("All demo orders and stats cleared successfully!");
      } catch (error) {
        console.error("Error clearing orders: ", error);
        alert("Error clearing orders. Please check the console.");
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthYear = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    doc.setFontSize(20);
    doc.text(`Monthly Sales Report - ${monthYear}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const now = new Date();
    const thisMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    const monthlyOrders = orders.filter((order) => {
      const orderDate = new Date(
        order.createdAt?.seconds
          ? order.createdAt.seconds * 1000
          : Date.parse(order.createdAt) || 0,
      ).getTime();
      return orderDate >= thisMonthStart;
    });

    const totalRev = monthlyOrders.reduce(
      (acc, order) => acc + (order.total || 0),
      0,
    );

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Orders: ${monthlyOrders.length}`, 14, 40);
    doc.text(`Total Revenue: Rs. ${totalRev.toLocaleString("en-IN")}`, 14, 46);

    const tableColumn = [
      "Order ID",
      "Date",
      "Items",
      "Payment",
      "Amount",
      "Status",
    ];
    const tableRows: any[] = [];

    monthlyOrders.forEach((order) => {
      const date = new Date(
        order.createdAt?.seconds
          ? order.createdAt.seconds * 1000
          : Date.parse(order.createdAt) || 0,
      );
      const dateStr =
        date.toLocaleDateString("en-IN") +
        " " +
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

      const itemDetails =
        order.items
          ?.map((cartItem: any) => {
            let detailStr = `${cartItem.quantity || 1}x ${cartItem.item?.name}`;
            const extras = [];
            if (cartItem.selectedBread)
              extras.push(`Bread: ${cartItem.selectedBread}`);
            if (cartItem.selectedAddons?.length > 0)
              extras.push(
                `Add-ons: ${cartItem.selectedAddons.map((a: any) => a.name).join(", ")}`,
              );
            if (cartItem.specialInstructions)
              extras.push(`Note: ${cartItem.specialInstructions}`);

            if (extras.length > 0) {
              detailStr += `\n   ${extras.join(" | ")}`;
            }
            return detailStr;
          })
          .join("\n") || "No items";

      const rowData = [
        `#${order.id.slice(-5).toUpperCase()}`,
        dateStr,
        itemDetails,
        order.paymentMethod ? order.paymentMethod.toUpperCase() : "N/A",
        `Rs. ${order.total || 0}`,
        order.status.toUpperCase(),
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [249, 115, 22] }, // Orange 500
    });

    doc.save(`Sales_Report_${monthYear.replace(" ", "_")}.pdf`);
  };

  const renderOrderItems = (order: any) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
        Order Contents
      </h4>
      <ul className="space-y-3">
        {order.items?.map((cartItem: any, idx: number) => (
          <li key={idx} className="text-sm flex justify-between items-start">
            <div className="flex items-start gap-3">
              <span className="bg-white text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-xs font-black min-w-[28px] text-center">
                {cartItem.quantity}x
              </span>
              <div>
                <span className="font-bold text-slate-900 text-base">
                  {cartItem.item?.name}
                </span>

                {(cartItem.selectedBread ||
                  (cartItem.selectedAddons &&
                    cartItem.selectedAddons.length > 0)) && (
                  <div className="mt-1 pl-2 border-l-2 border-orange-200 text-slate-500 text-xs space-y-1">
                    {cartItem.selectedBread && (
                      <div>
                        <span className="text-orange-500">•</span>{" "}
                        {cartItem.selectedBread}
                      </div>
                    )}
                    {cartItem.selectedAddons &&
                      cartItem.selectedAddons.length > 0 && (
                        <div>
                          <span className="text-orange-500">+</span>{" "}
                          {cartItem.selectedAddons
                            .map((a: any) => a.name)
                            .join(", ")}
                        </div>
                      )}
                  </div>
                )}

                {cartItem.specialInstructions && (
                  <div className="mt-2 bg-yellow-50 text-yellow-800 px-2 py-1.5 rounded text-xs font-medium border border-yellow-100 flex items-start">
                    <span>Note: {cartItem.specialInstructions}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="font-bold text-slate-900">
              {formatCurrency(cartItem.item?.price * cartItem.quantity)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shadow-sm sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Analytics & Business Overview
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => router.push("/cook")}
            className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <ChefHat className="w-4 h-4" /> Kitchen Dashboard
          </button>
          <button
            onClick={() => router.push("/admin/inventory")}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm flex items-center justify-center gap-2"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* Top Tier Metrics - Revenue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10">
              <TrendingUp className="w-24 h-24 text-orange-500" />
            </div>
            <div className="relative">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" /> Daily Revenue
              </h3>
              <p className="mt-3 text-3xl sm:text-4xl font-black text-slate-900">
                {formatCurrency(dailyRevenue)}
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-600 bg-slate-100 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                <span>{ordersToday} orders today</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10">
              <CalendarDays className="w-24 h-24 text-orange-500" />
            </div>
            <div className="relative">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-500" /> Monthly
                Revenue
              </h3>
              <p className="mt-3 text-3xl sm:text-4xl font-black text-slate-900">
                {formatCurrency(monthlyRevenue)}
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-600 bg-slate-100 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                <span>{ordersThisMonth} orders this month</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-800 relative overflow-hidden sm:col-span-2 md:col-span-1">
            <div className="absolute right-4 top-4 opacity-10">
              <Wallet className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-300" /> Lifetime Revenue
              </h3>
              <p className="mt-3 text-3xl sm:text-4xl font-black text-white">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-300 bg-slate-800 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
                <span>{orders.length} total lifetime orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Middle Tier - Payment Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" /> Payment Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <span className="font-black text-emerald-700 text-[10px]">
                      CASH
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 text-sm">
                    Physical
                  </span>
                </div>
                <span className="font-black text-slate-900 text-lg">
                  {formatCurrency(cashRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Tier - Kitchen & Top Products */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-200 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                <Package className="w-40 h-40 text-orange-600" />
              </div>
              <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider mb-4 relative z-10">
                Top Product Today
              </h3>
              <div className="relative z-10">
                {topProductToday.count > 0 ? (
                  <>
                    <p className="text-2xl sm:text-3xl font-black text-orange-900 leading-tight">
                      {topProductToday.name}
                    </p>
                    <p className="mt-3 text-orange-800 text-sm font-bold bg-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-100 w-fit">
                      🔥 {topProductToday.count} units sold
                    </p>
                  </>
                ) : (
                  <p className="text-orange-800 font-medium bg-white px-4 py-2 rounded-lg w-fit border border-orange-100">
                    No sales yet today
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-slate-400" /> Kitchen Queue
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Pending
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{
                        width: `${Math.min(100, kitchenStatus.pending * 10)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right font-black text-slate-700">
                    {kitchenStatus.pending}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <PlayCircle className="w-3 h-3" /> Prep
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{
                        width: `${Math.min(100, kitchenStatus.preparing * 10)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right font-black text-slate-700">
                    {kitchenStatus.preparing}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{
                        width: `${Math.min(100, kitchenStatus.ready * 10)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right font-black text-slate-700">
                    {kitchenStatus.ready}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              Recent Orders
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Latest {Math.min(orders.length, 15)}
              </span>
              <button
                onClick={clearOrders}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Clear Demo Data
              </button>
              <button
                onClick={generatePDF}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Total
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 15).map((order) => {
                  const itemCount =
                    order.items?.reduce(
                      (acc: number, item: any) => acc + (item.quantity || 1),
                      0,
                    ) || 0;
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50" : ""}`}
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : order.id)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                          #{order.id.slice(-5).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 text-right">
                          {formatCurrency(order.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end items-center gap-3">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-white px-6 py-4 border-b border-slate-200"
                          >
                            {renderOrderItems(order)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {orders.slice(0, 15).map((order) => {
              const itemCount =
                order.items?.reduce(
                  (acc: number, item: any) => acc + (item.quantity || 1),
                  0,
                ) || 0;
              const isExpanded = expandedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order.id)
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-black text-slate-900">
                        #{order.id.slice(-5).toUpperCase()}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        {formatTime(order.createdAt)}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase">
                        {order.paymentMethod}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {itemCount} items
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">
                      {formatCurrency(order.total || 0)}
                    </span>
                  </div>
                  {isExpanded && renderOrderItems(order)}
                </div>
              );
            })}
          </div>

          {orders.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium bg-white border-t border-slate-100">
              No orders have been placed yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
