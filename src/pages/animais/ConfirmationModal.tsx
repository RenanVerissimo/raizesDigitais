import React from "react";
import {
    ActivityIndicator,
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    visible: boolean;
    title: string;
    nomeAnimal: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function ConfirmDeleteModal({ visible, title, nomeAnimal, onConfirm, onCancel, loading = false }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={loading ? undefined : onCancel}
        >
            <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>



                            <View style={styles.iconWrapper}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name="cow" size={28} color="#ef4444" />
                                </View>
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.description}>
                                Tem certeza que deseja excluir{" "}
                                <Text style={styles.animalName}>{nomeAnimal}</Text>
                                {"? "}
                                Esta ação não pode ser desfeita.
                            </Text>

                            <View style={styles.warningBox}>
                                <Feather name="alert-triangle" size={14} color="#d97706" />
                                <Text style={styles.warningText}>
                                    O animal e todos os seus dados serão removidos permanentemente.
                                </Text>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    onPress={loading ? undefined : onCancel}
                                    activeOpacity={0.7}
                                    disabled={loading}
                                    style={[styles.cancelButton, loading && styles.disabledButton]}
                                >
                                    <Text style={styles.cancelText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onConfirm}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                    style={[styles.deleteButton, loading && styles.disabledButton]}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Feather name="trash-2" size={16} color="#fff" />
                                            <Text style={styles.deleteText}>Excluir</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
    },
    sheet: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#e5e7eb",
        alignSelf: "center",
        marginBottom: 24,
    },
    iconWrapper: {
        alignItems: "center",
        marginBottom: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#fef2f2",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0a0a0a",
        textAlign: "center",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 16,
    },
    animalName: {
        fontWeight: "700",
        color: "#0a0a0a",
    },
    warningBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "#fffbeb",
        borderWidth: 1,
        borderColor: "#fde68a",
        borderRadius: 10,
        padding: 12,
        marginBottom: 24,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: "#92400e",
        lineHeight: 17,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#f3f4f6",
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#374151",
    },
    deleteButton: {
        flex: 1,
        backgroundColor: "#ef4444",
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    deleteText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },
    disabledButton: {
        opacity: 0.65,
    },
});
