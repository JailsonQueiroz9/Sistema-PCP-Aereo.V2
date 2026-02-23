
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send, RotateCw, Loader2, Image as ImageIcon, Search, Plus,
  Hash, AtSign, Edit3, X, MessageSquare, Zap, Check, ChevronDown,
  Smile, Type, Sticker, Bold, Italic, Strikethrough, Code, Clock,
  Car, Apple, Dog, Trophy, Umbrella, Lightbulb, Heart, Flag
} from 'lucide-react';
import { ChatMessage, User, ChatGroup, GroupCreatePayload } from '../types';
import { storageService } from '../services/storageService';
import { useChatLoop } from '../hooks/useChatLoop';
import SidebarChat from './SidebarChat';
import CreateGroupModal from './CreateGroupModal';

// Categorias de Emojis Estilo WhatsApp
const EMOJI_CATEGORIES = [
  { id: 'smileys', label: '😃', icon: <Smile size={16} />, emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'] },
  { id: 'animals', label: '🐶', icon: <Dog size={16} />, emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦝', '🐈', '🐈‍⬛', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐂', '🐃', '🐄', '🐖', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐁', '🐀', '🐿️', '🦫', '🦔', '🦇', '🐻‍❄️', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾'] },
  { id: 'food', label: '🍎', icon: <Apple size={16} />, emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '發', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', 'バター', '🥞', ' waffle', ' bacon', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥣', '🍝', '🍜', '🍲', ' curry', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', ' popcorn', '🍩', '🍪', '🌰', '🥜', '🍯'] },
  { id: 'activities', label: '⚽', icon: <Trophy size={16} />, emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', ' hockey', ' field hockey', '🥍', ' cricket', ' boomerang', ' goal', '⛳', ' kite', ' bow and arrow', ' fishing', ' diver', ' boxing', ' martial arts', ' running shirt', ' skateboard', ' roller skate', ' sled', ' ice skate', ' ski', ' skier', ' snowboarder', ' parachute', ' weight lifter', ' wrestler', ' gymnast', ' basketball player', ' fencer', ' handball player', ' golfer', ' horse racing', ' yoga', ' surfer', ' swimmer', ' water polo', ' rower', ' climber', ' cyclist', ' mountain biker', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', ' rosette', ' ticket', '🎟️', ' performing arts', '🎨', ' movie', ' mic', ' headphones', ' musical score', ' piano', ' drum', '🪘', ' saxophone', ' trumpet', ' guitar', ' banjo', ' violin', ' game die', ' chess pawn', '🎯', ' bowling', ' video game', ' slot machine', ' puzzle'] },
  { id: 'travel', label: '🚗', icon: <Car size={16} />, emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', ' skateboard', ' roller skate', ' bus stop', ' motorway', ' railway track', ' oil drum', ' fuel pump', '🚨', '🚥', '🚦', '🛑', '🚧', ' anchor', ' sailboat', ' canoe', ' speedboat', ' passenger ship', ' ferry', ' ship', ' airplane', '🛫', '🛬', ' parachute', '💺', ' helicopter', ' suspension railway', ' mountain cableway', ' aerial tramway', ' rocket', ' flying saucer', ' satellite'] },
  { id: 'objects', label: '💡', icon: <Lightbulb size={16} />, emojis: ['⌚', '📱', '📲', '💻', ' keyboard', ' mouse', ' trackball', ' joystick', ' clamp', ' computer disk', ' floppy disk', ' optical disk', ' dvd', ' vhs', ' camera', '📸', ' video camera', ' movie camera', ' projector', ' film frames', ' telephone', '☎️', ' pager', ' fax machine', '📺', ' radio', ' studio microphone', ' level slider', ' control knobs', ' compass', ' stopwatch', ' timer clock', ' alarm clock', ' mantelpiece clock', ' hourglass done', ' hourglass not done', ' satellite antenna', ' battery', ' electric plug', '💡', ' flashlight', ' candle', ' diyah lamp', ' fire extinguisher', ' oil drum', ' money bag', ' dollar banknote', ' yen banknote', ' euro banknote', ' pound banknote', ' coin', ' money bag', ' credit card', ' gem stone', ' balance scale', ' ladder', ' toolbox', ' screwdriver', ' wrench', ' hammer', ' hammer and pick', ' tools', ' pick', ' carpentry saw', ' pistol', ' bomb', ' boomerang', ' kitchen knife', ' dagger', ' crossed swords', ' shield', ' cigarette', ' coffin', ' funeral urn', ' amphora', ' crystal ball', ' prayer beads', ' nazar amulet', ' barber pole', ' alembic', ' telescope', ' microscope', ' hole', ' stethoscope', ' x-ray', ' test tube', ' petri dish', ' dna', ' pill', ' syringe', ' drop of blood', ' label', ' bookmark'] },
  // Fix: Changed non-existent 'Symbols' to 'Heart' icon
  { id: 'symbols', label: '🔣', icon: <Heart size={16} />, emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤'] }
];

// Figurinhas Operacionais (Stickers)
const LOGISTIC_STICKERS = [
  { id: 'delivered', url: 'https://cdn-icons-png.flaticon.com/512/1161/1161388.png', label: 'ENTREGUE' },
  { id: 'delay', url: 'https://cdn-icons-png.flaticon.com/512/2814/2814368.png', label: 'ATRASO' },
  { id: 'transit', url: 'https://cdn-icons-png.flaticon.com/512/713/713311.png', label: 'TRÂNSITO' },
  { id: 'boarding', url: 'https://cdn-icons-png.flaticon.com/512/784/784841.png', label: 'EMBARQUE' },
  { id: 'import', url: 'https://cdn-icons-png.flaticon.com/512/2891/2891415.png', label: 'IMPORT' },
  { id: 'ok', url: 'https://cdn-icons-png.flaticon.com/512/1632/1632670.png', label: 'CARGA OK' }
];

const Chat: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<ChatGroup>({
    name: 'GRUPO PCP',
    sheetName: 'CHAT',
    type: 'group',
    unreadCount: 0,
    lastReadCount: 0
  });

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);

  const [inputText, setInputText] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [isMuted] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // States para Popovers
  const [activePopover, setActivePopover] = useState<'emoji' | 'sticker' | 'format' | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { messages, loading, unreadMap, previews, refreshActive, markAsRead } = useChatLoop(activeSession.sheetName, currentUser, isMuted);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar usuário:", e);
      }
    }

    storageService.getUsers().then(setUsers);
    storageService.getGroups().then(dynamicGroups => {
      const baseGroups: ChatGroup[] = [
        { name: 'GRUPO PCP', sheetName: 'CHAT', type: 'group', unreadCount: 0, lastReadCount: 0 },
        { name: 'LOGÍSTICA INTERNA', sheetName: 'LOG_INT', type: 'group', unreadCount: 0, lastReadCount: 0 }
      ];

      const mapped = dynamicGroups.map(g => ({
        name: g.name,
        sheetName: g.name,
        type: 'group' as const,
        unreadCount: 0,
        lastReadCount: 0
      }));

      const final = [...baseGroups];
      mapped.forEach(mg => {
        if (!final.find(f => f.sheetName === mg.sheetName)) final.push(mg);
      });

      setGroups(final);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
    markAsRead(activeSession.sheetName, messages.length);
  }, [messages, activeSession.sheetName]);

  const handleSend = async (customPayload?: Partial<ChatMessage>) => {
    if (!currentUser || sending) return;

    const textValue = customPayload?.text !== undefined ? customPayload.text : inputText.trim();
    const imageToUpload = customPayload?.img || previewImage;

    if (!textValue && !imageToUpload) return;

    setSending(true);
    try {
      let finalImageUrl = customPayload?.img || "";

      if (selectedFile) {
        finalImageUrl = await storageService.uploadFile(selectedFile);
      } else if (previewImage && !customPayload?.img) {
        finalImageUrl = previewImage;
      }

      const userName = currentUser.name || currentUser.USUÁRIO || "Operador";

      const data: Partial<ChatMessage> = {
        user: userName,
        text: textValue,
        img: finalImageUrl,
        type: finalImageUrl ? 'image' : 'text',
        timestamp: new Date().toISOString()
      };

      await storageService.saveChatMessage(activeSession.sheetName, data);

      if (!customPayload) {
        setInputText('');
        setPreviewImage(null);
        setSelectedFile(null);
      }
      setActivePopover(null);
      await refreshActive();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputText;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setInputText(newText);

    // Devolver o foco e selecionar o texto formatado
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 10);
  };

  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setInputText(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = inputText.substring(0, start);
    const after = inputText.substring(end);
    setInputText(before + emoji + after);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
      }
    }, 10);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!msgSearch) return messages;
    return messages.filter(m =>
      m.text.toLowerCase().includes(msgSearch.toLowerCase()) ||
      m.user.toLowerCase().includes(msgSearch.toLowerCase())
    );
  }, [messages, msgSearch]);

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#050a14]">
      <SidebarChat
        currentUser={currentUser}
        users={users}
        groups={groups}
        activeSession={activeSession}
        onSelect={(s) => { setActiveSession(s); setActivePopover(null); }}
        unreadMap={unreadMap}
        previews={previews}
        onAddGroup={() => setIsCreateGroupModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 border-l border-white/5 relative">
        <header className="px-8 py-6 border-b border-white/5 bg-[#0c1425]/90 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${activeSession.type === 'group' ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500'}`}>
              {activeSession.type === 'group' ? <Hash size={20} /> : <AtSign size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{activeSession.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] italic">Servidor Ativo</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="BUSCAR NO FLUXO..."
                className="bg-[#050a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[9px] font-black text-white outline-none focus:border-blue-500 transition-all uppercase tracking-widest placeholder:text-slate-800 w-48"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
              />
            </div>
            <button onClick={refreshActive} className="p-3 bg-slate-900 border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all active:scale-95">
              <RotateCw size={18} className={loading ? 'animate-spin text-blue-500' : ''} />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative">
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.user === (currentUser?.name || currentUser?.USUÁRIO);
            const displayTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

            return (
              <div key={msg.id || idx} className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0 shadow-lg ${isMe ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                  {msg.user ? msg.user.charAt(0).toUpperCase() : '?'}
                </div>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-3 mb-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-black uppercase text-slate-400">{msg.user}</span>
                    <span className="text-[9px] text-slate-600 font-bold">{displayTime}</span>
                  </div>

                  <div className={`px-5 py-4 rounded-[26px] text-sm shadow-2xl relative transition-all ${isMe ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/40' : 'bg-[#0c1425] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.img ? (
                      <div className="space-y-3">
                        <img
                          src={msg.img}
                          alt="Arquivo"
                          className="rounded-2xl max-w-full h-auto cursor-zoom-in hover:brightness-110 transition-all border border-white/10 max-h-96 object-contain"
                          onClick={() => window.open(msg.img, '_blank')}
                        />
                        {msg.text && <p className="font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                    ) : (
                      <p className="font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-[#0c1425]/90 backdrop-blur-md border-t border-white/5 relative">

          {/* Popover de Formatação */}
          {activePopover === 'format' && (
            <div className="absolute left-32 bottom-[110%] mb-4 bg-[#0c1425] border border-white/10 rounded-2xl flex items-center gap-2 p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50">
              <button onClick={() => applyFormatting('**')} className="p-3 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all"><Bold size={18} /></button>
              <button onClick={() => applyFormatting('_')} className="p-3 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all"><Italic size={18} /></button>
              <button onClick={() => applyFormatting('~~')} className="p-3 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all"><Strikethrough size={18} /></button>
              <button onClick={() => applyFormatting('`')} className="p-3 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all"><Code size={18} /></button>
            </div>
          )}

          {/* Popover de Emojis */}
          {activePopover === 'emoji' && (
            <div className="absolute right-40 bottom-[110%] mb-4 w-72 bg-[#0c1425] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="flex border-b border-white/5 p-2 bg-[#050a14]/50 overflow-x-auto no-scrollbar">
                {EMOJI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveEmojiCategory(cat.id)}
                    className={`p-3 rounded-xl transition-all ${activeEmojiCategory === cat.id ? 'bg-blue-600/20 text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
              <div className="p-4 grid grid-cols-6 gap-2 h-64 overflow-y-auto custom-scrollbar bg-[#0c1425]">
                {EMOJI_CATEGORIES.find(c => c.id === activeEmojiCategory)?.emojis.map((emoji, i) => (
                  <button key={i} onClick={() => insertEmoji(emoji)} className="text-2xl hover:bg-white/5 p-1 rounded-lg transition-all active:scale-90">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popover de Stickers */}
          {activePopover === 'sticker' && (
            <div className="absolute right-24 bottom-[110%] mb-4 w-72 bg-[#0c1425] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="p-4 bg-[#050a14]/50 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sticker size={14} /> Figurinas Operacionais
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 h-64 overflow-y-auto custom-scrollbar bg-[#0c1425]">
                {LOGISTIC_STICKERS.map(stk => (
                  <button
                    key={stk.id}
                    onClick={() => handleSend({ img: stk.url, text: '', type: 'image' })}
                    className="group flex flex-col items-center gap-2 hover:bg-white/5 p-3 rounded-2xl transition-all"
                  >
                    <img src={stk.url} alt={stk.label} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                    <span className="text-[7px] font-black text-slate-600 group-hover:text-blue-500">{stk.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto flex items-center gap-4 px-2">
            <button
              onClick={() => fileRef.current?.click()}
              className={`p-4 bg-[#0c1425] border border-white/5 rounded-2xl transition-all shadow-lg shrink-0 ${previewImage ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
              title="Anexar Imagem"
            >
              <ImageIcon size={22} />
            </button>
            <input type="file" ref={fileRef} onChange={onImageUpload} className="hidden" accept="image/*" />

            <div className="flex-1 relative flex items-center bg-[#050a14] border border-white/10 rounded-[28px] pr-6 shadow-inner focus-within:border-blue-600/50 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="REPASSAR INFORMAÇÃO OPERACIONAL..."
                className="flex-1 bg-transparent px-8 py-4 text-sm font-bold text-white outline-none resize-none placeholder:text-slate-800 uppercase tracking-widest min-h-[56px] max-h-32 custom-scrollbar"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="flex items-center gap-4 shrink-0 text-slate-500">
                <button
                  onClick={() => setActivePopover(activePopover === 'format' ? null : 'format')}
                  className={`hover:text-blue-400 transition-colors p-1 ${activePopover === 'format' ? 'text-blue-500' : ''}`}
                >
                  <Type size={20} className="border-b-2 border-slate-700 pb-0.5" />
                </button>
                <button
                  onClick={() => setActivePopover(activePopover === 'emoji' ? null : 'emoji')}
                  className={`hover:text-amber-400 transition-colors p-1 ${activePopover === 'emoji' ? 'text-amber-500' : ''}`}
                >
                  <Smile size={20} />
                </button>
                <button
                  onClick={() => setActivePopover(activePopover === 'sticker' ? null : 'sticker')}
                  className={`hover:text-emerald-400 transition-colors p-1 ${activePopover === 'sticker' ? 'text-emerald-500' : ''}`}
                >
                  <Sticker size={20} />
                </button>
              </div>
            </div>

            <button
              onClick={() => handleSend()}
              disabled={sending || (!inputText.trim() && !previewImage)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 disabled:opacity-50 bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 glow-blue shrink-0"
            >
              {sending ? <Loader2 className="animate-spin text-white" size={20} /> : <Send size={22} />}
            </button>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onCreate={async (p) => {
          await storageService.createGroup(p);
          const dynamicGroups = await storageService.getGroups();
          setGroups(dynamicGroups.map(g => ({ ...g, type: 'group', unreadCount: 0, lastReadCount: 0 } as ChatGroup)));
        }}
      />
    </div>
  );
};

export default Chat;
