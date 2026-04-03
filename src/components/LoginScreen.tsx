import { Milk, User, Building2, Sparkles, TrendingUp, BarChart3, Lock, Mail, Eye, EyeOff, Phone } from 'lucide-react';
import { useState } from 'react';
import cowLogo from 'figma:asset/f59e19d886bcb0de9ff081cb9683b64da67061ae.png';

interface LoginScreenProps {
  onLogin: (user: { name: string; farmName: string }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    farmName: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      // Simular login bem-sucedido
      onLogin({ name: 'Produtor', farmName: 'Minha Fazenda' });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    if (registerData.name && registerData.email && registerData.farmName && registerData.password) {
      // Simular cadastro bem-sucedido
      onLogin({ name: registerData.name, farmName: registerData.farmName });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 size-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 size-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <Milk className="absolute top-32 left-12 size-8 text-white/20 animate-bounce" style={{ animationDuration: '3s' }} />
        <TrendingUp className="absolute top-48 right-16 size-6 text-white/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <BarChart3 className="absolute bottom-40 left-20 size-7 text-white/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        <Sparkles className="absolute bottom-32 right-24 size-5 text-white/20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative size-24 bg-gradient-to-br from-white to-white/90 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 p-4">
              <img src={cowLogo} alt="LeitePro" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -top-2 -right-2 size-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="size-4 text-white" fill="white" />
            </div>
          </div>
          
          <h1 className="text-white text-4xl mb-3 tracking-tight">LeitePro</h1>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <p className="text-white/95 text-sm">Gestão Inteligente de Produção Leiteira</p>
          </div>
        </div>

        {/* Login/Register card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]"></div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                isLogin
                  ? 'bg-white text-[#3b82f6] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                !isLogin
                  ? 'bg-white text-[#3b82f6] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-neutral-950 text-2xl mb-2">Bem-vindo de Volta!</h2>
                <p className="text-gray-500 text-sm">Entre com suas credenciais</p>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="size-4 text-[#3b82f6] rounded focus:ring-[#3b82f6]" />
                    <span className="text-gray-600">Lembrar de mim</span>
                  </label>
                  <button type="button" className="text-[#3b82f6] hover:text-[#2563eb] transition-colors">
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white py-4 rounded-xl hover:from-[#2563eb] hover:to-[#1d4ed8] transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Entrar no Sistema
                    <Sparkles className="size-4" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </form>
            </div>
          ) : (
            // Register Form
            <div>
              <div className="text-center mb-6">
                <h2 className="text-neutral-950 text-2xl mb-2">Criar Conta</h2>
                <p className="text-gray-500 text-sm">Preencha os dados para começar</p>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      placeholder="Digite seu nome completo"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Telefone</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Nome da Fazenda</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type="text"
                      value={registerData.farmName}
                      onChange={(e) => setRegisterData({ ...registerData, farmName: e.target.value })}
                      placeholder="Digite o nome da fazenda"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="••••••••"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-950 mb-2 ml-1">Confirmar Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white py-4 rounded-xl hover:from-[#2563eb] hover:to-[#1d4ed8] transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Criar Conta
                    <Sparkles className="size-4" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </form>
            </div>
          )}

          {/* Version */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              Versão 1.0 - Sistema de Gestão Leiteira
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}