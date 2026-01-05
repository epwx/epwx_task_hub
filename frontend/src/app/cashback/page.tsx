"use client";
import React from "react";
import { EPWXCashbackClaim } from "../../components/EPWXCashbackClaim";

export default function CashbackPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">EPWX Cashback Rewards</h1>
      <EPWXCashbackClaim />
    </div>
  );
}
