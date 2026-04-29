import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
    value: string;                    // formato "DD/MM/AAAA"
    onChange: (v: string) => void;
    placeholder?: string;
};

export default function DateInput({ value, onChange, placeholder = "DD/MM/AAAA" }: Props) {
    const [showPicker, setShowPicker] = useState(false);

    // Aplica máscara automática enquanto digita
    function handleType(text: string) {
        const digits = text.replace(/\D/g, "").slice(0, 8);
        let formatted = digits;
        if (digits.length >= 5) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        } else if (digits.length >= 3) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        onChange(formatted);
    }

    function handlePickerChange(_: any, selected?: Date) {
        setShowPicker(false);
        if (selected) {
            const dd = String(selected.getDate()).padStart(2, "0");
            const mm = String(selected.getMonth() + 1).padStart(2, "0");
            const yyyy = selected.getFullYear();
            onChange(`${dd}/${mm}/${yyyy}`);
        }
    }

    function parseValueToDate(): Date {
        const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
            const d = new Date(+m[3], +m[2] - 1, +m[1]);
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    }

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
                value={value}
                onChangeText={handleType}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={10}
                style={{
                    flex: 1,
                    backgroundColor: "#f9fafb",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: "#0a0a0a",
                }}
            />
            <TouchableOpacity
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
                style={{
                    padding: 12,
                    backgroundColor: "#eff6ff",
                    borderWidth: 1,
                    borderColor: "#dbeafe",
                    borderRadius: 10,
                }}
            >
                <Feather name="calendar" size={20} color="#4a90e2" />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={parseValueToDate()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handlePickerChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}