import React, { forwardRef } from 'react';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  customizations?: string[];
}

export interface ReceiptProps {
  orderId: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ orderId, date, items, subtotal, total }, ref) => {
    return (
      <div 
        ref={ref} 
        className="font-mono text-black bg-white p-2"
        style={{ width: '58mm', fontSize: '10px', lineHeight: '1.2' }}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="font-bold text-lg mb-1">Shawarma365</h1>
          <p>Order #{orderId.slice(-5).toUpperCase()}</p>
          <p>{date}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Column Headers */}
        <div className="flex justify-between font-bold mb-1">
          <span className="flex-1">ITEM</span>
          <span className="w-12 text-right">TOTAL</span>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Itemized List */}
        <div className="mb-2">
          {items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="flex-1 pr-1 font-bold">
                  {item.quantity}x {item.name}
                </span>
                <span className="w-12 text-right">
                  {item.total}
                </span>
              </div>
              {item.customizations && item.customizations.length > 0 && (
                <div className="pl-4 text-[9px]">
                  {item.customizations.map((cust, idx) => (
                    <div key={idx}>- {cust}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Footer Totals */}
        <div className="flex justify-between mb-1">
          <span>SUBTOTAL:</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mb-2">
          <span>TOTAL:</span>
          <span>{total}</span>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Footer Note */}
        <div className="text-center mt-3 mb-2">
          <p className="font-bold">Thank you for ordering!</p>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
