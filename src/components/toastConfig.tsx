import React from "react";
import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            text1NumberOfLines={2}
            text2NumberOfLines={4}
            style={{ borderLeftColor: "#22c55e", minHeight: 74, width: "92%" }}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
            text1Style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}
            text2Style={{ fontSize: 12, color: "#475569", lineHeight: 17 }}
        />
    ),
    error: (props: any) => (
        <ErrorToast
            {...props}
            text1NumberOfLines={2}
            text2NumberOfLines={4}
            style={{ borderLeftColor: "#ef4444", minHeight: 74, width: "92%" }}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
            text1Style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}
            text2Style={{ fontSize: 12, color: "#475569", lineHeight: 17 }}
        />
    ),
};
