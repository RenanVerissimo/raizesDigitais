import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

const secoes = [
    ["1. Apresentação", "Estes Termos estabelecem as condições de uso do Raízes Digitais, aplicativo de apoio à gestão rural. Suas funcionalidades permitem organizar informações sobre animais, produção, estoque, compras, receitas e financiamentos, conforme os recursos disponíveis em cada versão."],
    ["2. Leitura e aceitação", "Antes de concluir o cadastro, leia estes Termos e a Política de Privacidade. Ao marcar a opção de aceite e prosseguir, você declara que leu e concorda com estas condições. Caso não concorde, não conclua o cadastro."],
    ["3. Cadastro e segurança", "Forneça informações corretas e atualizadas e utilize somente dados que esteja autorizado a informar. Mantenha sua senha em sigilo e não compartilhe credenciais. Ao identificar acesso suspeito, altere suas credenciais e comunique o responsável pelo aplicativo pelos canais oficiais disponibilizados. Para atuar em nome de uma propriedade ou organização, é necessário ter autorização para representá-la."],
    ["4. Uso adequado", "Utilize o Raízes Digitais de forma lícita, respeitando os direitos de outras pessoas. Não é permitido inserir informações fraudulentas, acessar contas sem autorização, distribuir código malicioso, explorar vulnerabilidades ou interferir no funcionamento do aplicativo."],
    ["5. Informações e decisões de gestão", "Você é responsável pela exatidão e atualização dos registros que informa. Confira valores, datas, quantidades e demais dados antes de tomar decisões. Relatórios, gráficos, alertas e previsões dependem das informações registradas e são ferramentas de apoio. Não substituem orientação técnica, veterinária, contábil ou financeira e não representam garantia de produtividade ou de resultados econômicos."],
    ["6. Disponibilidade e sincronização", "O funcionamento pode depender do dispositivo, da conexão com a internet e de serviços utilizados pelo aplicativo. Podem ocorrer interrupções para manutenção e atualizações. Nas funcionalidades que permitem registros sem conexão, confira a conclusão da sincronização antes de considerar os dados disponíveis em outros dispositivos. Mantenha cópias dos registros essenciais à sua atividade."],
    ["7. Privacidade e dados pessoais", "O tratamento de dados pessoais deve observar a legislação aplicável e a Política de Privacidade do Raízes Digitais. Consulte esse documento para conhecer finalidades, compartilhamento, retenção e formas de exercer seus direitos. O aceite destes Termos não autoriza genericamente todo tratamento de dados nem substitui consentimento específico quando necessário."],
    ["8. Propriedade intelectual", "A marca, a interface, os elementos visuais e o código do Raízes Digitais são protegidos pelos direitos aplicáveis. O acesso permite o uso do aplicativo nestas condições, sem transferir a titularidade desses elementos. Os direitos sobre os dados e conteúdos inseridos permanecem com seus respectivos titulares."],
    ["9. Responsabilidades", "Cada parte responde por seus atos e obrigações conforme a legislação aplicável. Problemas decorrentes de dados incorretos, compartilhamento indevido de credenciais ou uso contrário a estes Termos serão avaliados conforme as circunstâncias. Nenhuma disposição afasta direitos obrigatórios do usuário ou exclui responsabilidades que não possam ser limitadas por lei."],
    ["10. Suspensão e encerramento", "O acesso poderá ser restringido quando necessário para conter uso indevido, fraude ou risco à segurança, respeitada a legislação aplicável e com comunicação quando cabível. Você pode deixar de utilizar o aplicativo. Solicitações de encerramento de conta e de tratamento dos dados devem seguir os canais e procedimentos informados na Política de Privacidade, observadas as hipóteses legais de conservação."],
    ["11. Alterações dos Termos", "Estes Termos poderão ser atualizados para refletir mudanças nas funcionalidades, nas condições de uso ou na legislação. Alterações relevantes deverão ser comunicadas de forma acessível, com indicação da versão aplicável e solicitação de novo aceite quando necessário."],
    ["12. Legislação e contato", "Estes Termos são regidos pela legislação brasileira. Dúvidas e solicitações devem ser encaminhadas aos canais oficiais do responsável pelo Raízes Digitais. Eventuais controvérsias serão submetidas ao órgão competente, preservados os direitos do usuário e as regras legais aplicáveis."],
];

export default function TermoDeUso() {
    const navigation = useNavigation();
    return (
        <LinearGradient colors={["#1e3a8a", "#3b82f6", "#60a5fa"]} style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar para a tela anterior" style={styles.backButton}>
                            <Ionicons name="chevron-back" size={22} color="#1e3a8a" />
                            <Text style={styles.backText}>Voltar</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Termos de Uso</Text>
                        <Text style={styles.subtitle}>Raízes Digitais</Text>
                    </View>
                    <ScrollView contentContainerStyle={styles.content}>
                        {secoes.map(([titulo, texto]) => (
                            <View key={titulo} style={styles.section}>
                                <Text style={styles.sectionTitle}>{titulo}</Text>
                                <Text selectable style={styles.paragraph}>{texto}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, padding: 16 },
    card: { flex: 1, backgroundColor: "white", borderRadius: 16, overflow: "hidden", width: "100%", maxWidth: 800, alignSelf: "center" },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 44, marginBottom: 8 },
    backText: { color: "#1e3a8a", fontSize: 14, fontWeight: "600" },
    title: { color: "#111827", fontSize: 24, fontWeight: "700" },
    subtitle: { color: "#6b7280", fontSize: 14, marginTop: 4 },
    content: { padding: 20, paddingBottom: 32, textAlign: "justify" },
    draft: { color: "#854d0e", backgroundColor: "#fef9c3", padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 18, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { color: "#1e3a8a", fontSize: 16, fontWeight: "600", marginBottom: 8 },
    paragraph: { color: "#374151", fontSize: 14, lineHeight: 23, textAlign: "justify" },
});
