
import { AWBRecord, User, ChatMessage, ViewType, GroupCreatePayload, ChatGroup } from '../types';

// Nova URL v3.2 fornecida pelo usuário
const API_URL = "https://script.google.com/macros/s/AKfycbxIGTPDc7KehB4uXAmFvKsk25nayH4ljDNxbyOvALxrhJN_9PIjdt-nAIIywtGrieNQzA/exec";

const normalizePermission = (p: string): ViewType | null => {
  const clean = p.trim().toUpperCase();
  if (clean.includes('DASHBOARD')) return 'dashboard';
  if (clean.includes('RELATORIO')) return 'reports';
  if (clean.includes('HISTORICO')) return 'history';
  if (clean.includes('CHAT')) return 'chat';
  if (clean.includes('FOLLOW-UP')) return 'follow-up';
  if (clean.includes('CONFIGURA')) return 'settings';
  return null;
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        redirect: 'follow'
      });
      if (response.ok) return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  throw new Error("Falha na conexão com a API.");
};

export const getApiUrl = () => API_URL;

export const storageService = {
  getChatMessages: async (sheet: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "CHAT_GET", sheet })
      });
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      // Mapeamento baseado no retorno do script GAS: id: r[0], user: r[1], text: r[2], img: r[3], timestamp: r[4], type: r[5]
      return data.map((item: any) => {
        const imgUrl = String(item.img || "");
        const hasImg = !!(imgUrl && imgUrl.startsWith('http'));
        return {
          id: String(item.id || ""),
          user: String(item.user || "Operador"),
          text: String(item.text || ""),
          img: imgUrl,
          timestamp: String(item.timestamp || ""),
          type: hasImg ? 'image' : 'text'
        };
      });
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return [];
    }
  },

  saveChatMessage: async (sheet: string, data: Partial<ChatMessage>) => {
    try {
      // O back-end p.user, p.text, p.img, p.timestamp, p.type
      const payload = {
        user: data.user,
        text: data.text || "",
        img: data.img || "",
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || (data.img ? "image" : "text")
      };
      
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: "CHAT_SAVE", 
          sheet, 
          data: payload 
        })
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      throw error;
    }
  },

  uploadFile: async (file: File): Promise<string> => {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const fullBase64 = await base64Promise;
      const base64 = fullBase64.split(',')[1];

      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: "UPLOAD", 
          data: { 
            fileName: file.name, 
            mimeType: file.type, 
            base64: base64 
          } 
        })
      });
      
      const result = await response.json();
      if (result.success && (result.url || result.id)) {
        // Extrai o ID para gerar link direto lh3 que funciona em tags <img> sem problemas de cross-origin ou login
        let fileId = result.id;
        if (!fileId && result.url) {
          const parts = result.url.split('/d/');
          if (parts.length > 1) {
            fileId = parts[1].split('/')[0];
          } else {
            const match = result.url.match(/id=([^&]+)/);
            if (match) fileId = match[1];
          }
        }
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : result.url;
      }
      throw new Error("Upload falhou: " + (result.error || "Erro desconhecido"));
    } catch (error) {
      console.error("Erro no upload:", error);
      throw error;
    }
  },

  ensureChatSheet: async (sheetName: string) => {
    try {
      return await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "CREATE_CHAT_SHEET", sheetName })
      });
    } catch (error) {
      console.error("Erro ao garantir aba:", error);
    }
  },

  createGroup: async (payload: GroupCreatePayload) => {
    try {
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "GROUP_CREATE", data: payload })
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  buildDM: (userA: string, userB: string) => {
    const sorted = [userA, userB].sort();
    return "DM_" + sorted.join("_").replace(/\s+/g, '_').toLowerCase();
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=CADASTRO USUÁRIO&t=${Date.now()}`);
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((u: any) => {
        const permsRaw = String(u["Permissões de Tela (Módulos)"] || '');
        const allowedViews = permsRaw.split(/[;|,]/).map(p => normalizePermission(p)).filter((v): v is ViewType => v !== null);
        return {
          ...u,
          id: String(u.ID || u.id || ''),
          name: String(u.USUÁRIO || u.name || ''),
          email: String(u["E-MAIL"] || u.email || ''),
          role: String(u.PAPEL || u.role || '').toLowerCase() === 'admin' ? 'admin' : 'user',
          status: String(u.STATUS || u.status || 'ativo').toLowerCase() as 'ativo' | 'inativo',
          allowedViews: allowedViews.length > 0 ? allowedViews : ['dashboard'],
          bio: String(u.Bio || u.bio || ''),
          location: String(u.Location || u.location || ''),
          cargo: String(u.Cargo || u.cargo || ''),
          birthday: String(u.Birthday || u.birthday || '')
        };
      });
    } catch (error) {
      return [];
    }
  },

  getGroups: async (): Promise<ChatGroup[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=ESPACO&t=${Date.now()}`);
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      return data.map((g: any) => ({
        name: String(g.name || g.NAME || ''),
        sheetName: String(g.name || g.NAME || ''),
        type: 'group',
        unreadCount: 0,
        lastReadCount: 0
      }));
    } catch (error) {
      return [];
    }
  },

  saveUser: async (user: any) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "SAVE", sheet: "CADASTRO USUÁRIO", data: user })
    });
    return await response.json();
  },

  getRecords: async (): Promise<AWBRecord[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=AWB&t=${Date.now()}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  saveRecord: async (record: Partial<AWBRecord>) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "SAVE", sheet: "AWB", data: record })
    });
    return response.json();
  },

  deleteRecord: async (id: string, sheet: string = "AWB") => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "DELETE", sheet, data: { id } })
    });
    return response.json();
  }
};

export const formatDate = (dateStr: any): string => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('pt-BR');
  } catch {
    return String(dateStr);
  }
};

export const toInputDate = (dateStr: any): string => {
  if (!dateStr || dateStr === '-') return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};
