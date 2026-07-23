import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { ReceiptTemplate, ReceiptItem } from './ReceiptTemplate';

export interface OrderActionPanelProps {
  order: any;
}

export default function OrderActionPanel({ order }: OrderActionPanelProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${order.id.slice(-5).toUpperCase()}`,
  });

  // Format order items to match ReceiptItem interface
  const receiptItems: ReceiptItem[] = (order.items || []).map((cartItem: any) => {
    const extras: string[] = [];
    if (cartItem.selectedBread) extras.push(`Bread: ${cartItem.selectedBread}`);
    if (cartItem.selectedAddons?.length > 0) {
      extras.push(`Add-ons: ${cartItem.selectedAddons.map((a: any) => a.name).join(", ")}`);
    }
    if (cartItem.specialInstructions) {
      extras.push(`Note: ${cartItem.specialInstructions}`);
    }

    return {
      name: cartItem.item?.name || 'Unknown Item',
      quantity: cartItem.quantity || 1,
      price: cartItem.item?.price || 0,
      total: (cartItem.item?.price || 0) * (cartItem.quantity || 1), // Simplification: addons cost not calculated here unless we derive from cartItem.price which typically isn't stored in this schema. Assuming order.total covers everything.
      customizations: extras,
    };
  });

  const dateStr = new Date(
    order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.parse(order.createdAt) || 0
  ).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Hidden Receipt Template */}
      <div style={{ display: 'none' }}>
        <ReceiptTemplate
          ref={componentRef}
          orderId={order.id}
          date={dateStr}
          items={receiptItems}
          subtotal={order.total || 0}
          total={order.total || 0}
        />
      </div>

      {/* Print Button */}
      <button
        onClick={() => handlePrint()}
        className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-700"
      >
        <Printer className="w-4 h-4" />
        Print Receipt
      </button>
    </div>
  );
}
