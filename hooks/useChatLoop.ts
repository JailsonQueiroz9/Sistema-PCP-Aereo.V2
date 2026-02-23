
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatGroup, User } from '../types';
import { storageService } from '../services/storageService';

export const useChatLoop = (activeSheet: string, currentUser: User | null, isMuted: boolean) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  
  const lastKnownCount = useRef<Record<string, number>>({});

  const fetchActive = async () => {
    const data = await storageService.getChatMessages(activeSheet);
    
    // Som removido conforme solicitado
    setMessages(data);
    lastKnownCount.current[activeSheet] = data.length;
    setUnreadMap(prev => ({ ...prev, [activeSheet]: 0 }));
    setLoading(false);
  };

  useEffect(() => {
    fetchActive();
    const timer = setInterval(fetchActive, 3000);
    return () => clearInterval(timer);
  }, [activeSheet]);

  return { 
    messages, 
    loading, 
    unreadMap, 
    previews, 
    refreshActive: fetchActive,
    markAsRead: (sheet: string, count: number) => {
      lastKnownCount.current[sheet] = count;
      setUnreadMap(prev => ({ ...prev, [sheet]: 0 }));
    }
  };
};
