import React from "react";
import {
	ActivityIndicator,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AnimalSyncStatus, { useAnimaisComSincronizacao } from "../../components/AnimalSyncStatus";

export default function TarefasAsync() {
	const navigation = useNavigation<any>();
	const { animais, carregando, pendentes, sincronizando, mensagem, sincronizarAgora } = useAnimaisComSincronizacao();
	const tarefasOffline = animais
		.filter((animal) => animal.salvo_offline)
		.map((animal) => ({
			id: animal.idempotency_key ?? animal.id,
			tipo: "Cadastro de animal",
			animal,
		}));

	return (
		<View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
			<View
				style={{
					backgroundColor: "#4a90e2",
					paddingTop: 54,
					paddingHorizontal: 20,
					paddingBottom: 20,
					flexDirection: "row",
					alignItems: "center",
					gap: 14,
				}}
			>
				<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
					<Feather name="arrow-left" size={24} color="#fff" />
				</TouchableOpacity>
				<View>
					<Text style={{ color: "#fff", fontSize: 21, fontWeight: "800" }}>Tarefas offline</Text>
					<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 3 }}>
						Todas as operações feitas sem conexão
					</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
				<AnimalSyncStatus
					pendentes={pendentes}
					sincronizando={sincronizando}
					mensagem={mensagem}
					sincronizarAgora={sincronizarAgora}
				/>

				{carregando ? (
					<View style={{ alignItems: "center", paddingVertical: 32 }}>
						<ActivityIndicator size="large" color="#4a90e2" />
					</View>
				) : tarefasOffline.length === 0 ? (
					<View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" }}>
						<Feather name="check-circle" size={38} color="#16a34a" />
						<Text style={{ color: "#111827", fontSize: 16, fontWeight: "700", marginTop: 12, textAlign: "center" }}>
							Nenhuma tarefa offline pendente
						</Text>
						<Text style={{ color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" }}>
							As operações realizadas sem conexão aparecerão aqui.
						</Text>
					</View>
				) : (
					<View style={{ gap: 10 }}>
						<Text style={{ color: "#111827", fontSize: 16, fontWeight: "800" }}>Tarefas pendentes ({tarefasOffline.length})</Text>
						{tarefasOffline.map((tarefa) => (
							<View key={tarefa.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" }}>
								<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
									<View style={{ backgroundColor: "#eff6ff", padding: 9, borderRadius: 10 }}>
										<MaterialCommunityIcons name="cow" size={21} color="#4a90e2" />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={{ color: "#111827", fontSize: 15, fontWeight: "800" }}>{tarefa.tipo}</Text>
										<Text style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>
											{tarefa.animal.nome || "Animal sem nome"} | Identificador: {tarefa.animal.identificador}
										</Text>
									</View>
									<View style={{ backgroundColor: "#fef3c7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
										<Text style={{ color: "#92400e", fontSize: 11, fontWeight: "700" }}>Offline</Text>
									</View>
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</View>
	);
}
