import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

const secoes = [
    ["1. Informações gerais", "Esta Política de Privacidade descreve a coleta, o uso, o armazenamento e a proteção de dados pessoais no Raízes Digitais, aplicativo de apoio à gestão rural. Aplica-se aos usuários do aplicativo e complementa seus Termos de Uso. O tratamento deve observar a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e as demais normas aplicáveis."],
    ["2. Como os dados são coletados", "As informações são fornecidas por você ao preencher o cadastro, acessar a conta e registrar dados nas funcionalidades do aplicativo. Registros de gestão também podem ser armazenados no dispositivo para uso sem conexão e enviados ao servidor durante a sincronização. Informe dados de outras pessoas somente quando houver autorização ou outra justificativa legal adequada."],
    ["3. Quais dados são tratados", "O cadastro contempla nome, e-mail, CPF/RG e senha, além de telefone e nome da fazenda quando informados. A senha é armazenada no servidor em formato de hash. O aplicativo também utiliza identificadores de conta e informações de sessão. Os registros de animais, produção, estoque, compras, receitas e financiamentos podem conter dados pessoais, como informações de compradores e fornecedores, conforme o conteúdo inserido pelo usuário."],
    ["4. Finalidades e bases legais", "Os dados são utilizados para cadastrar e autenticar usuários, vincular registros à conta, disponibilizar as funcionalidades de gestão e sincronizar informações. Cada operação deve ter uma base legal adequada, como execução de contrato, cumprimento de obrigação legal ou consentimento específico, quando exigido. O aceite dos Termos não representa consentimento genérico para qualquer finalidade. Novas finalidades devem ser informadas antes do tratamento correspondente."],
    ["5. Armazenamento e retenção", "Informações podem ser armazenadas nos servidores utilizados pelo aplicativo e localmente no dispositivo, para manter a sessão e permitir recursos sem conexão. Os dados devem ser mantidos somente pelo tempo necessário às finalidades informadas e às obrigações legais aplicáveis. Encerrado o tratamento, sua eliminação ou anonimização deve observar as hipóteses legais de conservação. Os prazos específicos de retenção ainda precisam ser definidos pelo responsável pelo aplicativo."],
    ["6. Segurança dos dados", "O servidor utiliza hash para armazenar senhas e tokens para autenticar requisições. A proteção dos dados também depende da configuração da infraestrutura e do dispositivo. Mantenha suas credenciais em sigilo, proteja o acesso ao aparelho e utilize versões atualizadas. Nenhum sistema é inteiramente livre de riscos. Incidentes devem ser avaliados pelo responsável e comunicados à autoridade e aos titulares quando exigido pela legislação. Esta política não pressupõe criptografia de todos os dados locais nem certificações de segurança não verificadas."],
    ["7. Compartilhamento e terceiros", "A comunicação com o servidor permite autenticação, armazenamento e sincronização. Prestadores de infraestrutura podem tratar dados na medida necessária à prestação desses serviços, conforme contratos e obrigações legais. A relação de fornecedores, os dados compartilhados e suas finalidades precisam ser confirmados pelo responsável antes da publicação desta política. O modelo não implica que perfis ou registros sejam públicos, nem autoriza venda de dados ou publicidade personalizada."],
    ["8. Transferências internacionais", "A localização dos servidores e dos fornecedores precisa ser confirmada pelo responsável pelo Raízes Digitais. Se houver transferência internacional de dados, os países, as finalidades e as garantias aplicáveis deverão ser informados, com observância dos mecanismos legais pertinentes. O simples uso do aplicativo não equivale a autorização irrestrita para transferências internacionais."],
    ["9. Cookies e armazenamento local", "O aplicativo utiliza armazenamento local para dados da conta e registros necessários a funcionalidades sem conexão. Esse armazenamento no dispositivo não equivale, por si só, ao uso de cookies de publicidade. Caso a versão web ou serviços adicionais utilizem cookies ou ferramentas de análise, suas categorias, finalidades e opções de gerenciamento deverão ser descritas antes de sua utilização. A remoção de dados locais pode afetar a sessão e registros ainda não sincronizados."],
    ["10. Direitos e consentimento", "Nos termos da legislação e observadas as condições aplicáveis, você pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados, portabilidade e informações sobre compartilhamento. Quando o tratamento depender de consentimento, você poderá revogá-lo, sem invalidar operações anteriores realizadas de forma lícita. Algumas informações poderão ser conservadas por obrigação legal. O contato para solicitações e o procedimento de verificação de identidade precisam ser definidos pelo responsável."],
    ["11. Alterações desta política", "Esta política poderá ser atualizada para refletir mudanças no aplicativo e nas práticas de tratamento. Alterações relevantes deverão ser comunicadas de forma acessível, com indicação da versão e da data aplicáveis. Quando necessário, deverá ser solicitado novo consentimento específico; o uso continuado não substitui esse consentimento."],
    ["12. Responsável, contato e legislação", "Esta política é regida pela legislação brasileira, preservadas as regras legais de competência e os direitos dos titulares. Antes da publicação, devem ser preenchidos: nome ou razão social do controlador; CPF ou CNPJ, conforme aplicável; endereço; canal de privacidade; e contato do encarregado, quando aplicável. Esses dados não foram fornecidos e não são presumidos neste documento."],
];

export default function PoliticaPrivacidade() {
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
                        <Text style={styles.title}>Política de Privacidade</Text>
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
    content: { padding: 20, paddingBottom: 32 },
    draft: { color: "#854d0e", backgroundColor: "#fef9c3", padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 18, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { color: "#1e3a8a", fontSize: 16, fontWeight: "600", marginBottom: 8 },
    paragraph: { color: "#374151", fontSize: 14, lineHeight: 23, textAlign: "justify" },
});

