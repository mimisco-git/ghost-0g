"use client";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px", amount: threshold });
  return { ref, isInView };
}
