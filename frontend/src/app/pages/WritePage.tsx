import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useDiary } from '../contexts/DiaryContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Bold, Italic, Save, X, Lock, Globe, Check, Eye, Edit3, Smile, Columns, Image as ImageIcon, Link as LinkIcon, Upload, Clock, CloudSun, Loader2, MapPin, Search, Mic, MicOff } from 'lucide-react';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const getWeatherInfo = (code: number) => {
  if (code === 0) return { description: '晴', icon: '☀️' };
  if (code >= 1 && code <= 3) return { description: '多云', icon: '⛅' };
  if (code >= 45 && code <= 48) return { description: '雾', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { description: '毛毛雨', icon: '🌧️' };
  if (code >= 61 && code <= 65) return { description: '雨', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { description: '雪', icon: '❄️' };
  if (code >= 80 && code <= 82) return { description: '阵雨', icon: '🌦️' };
  if (code >= 95) return { description: '雷雨', icon: '⛈️' };
  return { description: '未知', icon: '🌡️' };
};

const generateWeatherContent = (city: string, weatherData: any) => {
  if (!weatherData.current) return '';
  const { temperature_2m, weather_code, relative_humidity_2m, apparent_temperature, wind_speed_10m } = weatherData.current;
  const { description, icon } = getWeatherInfo(weather_code);
  
  // Generate natural weather description
  let tempDesc = '';
  if (apparent_temperature <= 5) tempDesc = '有些寒冷';
  else if (apparent_temperature <= 15) tempDesc = '有些微凉';
  else if (apparent_temperature <= 25) tempDesc = '温暖舒适';
  else if (apparent_temperature <= 30) tempDesc = '有些热';
  else tempDesc = '炎热';

  let windDesc = '';
  if (wind_speed_10m < 12) windDesc = '微风拂面';
  else if (wind_speed_10m < 20) windDesc = '和风习习';
  else if (wind_speed_10m < 30) windDesc = '清风徐来';
  else windDesc = '风力稍大';
  
  const dateStr = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });
  return `> ${dateStr} · ${city} · ${icon} ${description}\n> ${city}今天${description}${tempDesc}，${temperature_2m}°C，${windDesc}。\n\n`;
};

const WritingTimer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-indigo-200" title="Writing Duration">
      <Clock className="w-4 h-4 text-indigo-500" />
      <span className="tabular-nums">{formatTime(seconds)}</span>
    </div>
  );
};

export function WritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addEntry, updateEntry, getEntry, shortcuts } = useDiary();
  
  const existingEntry = id ? getEntry(id) : null;

  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [mood, setMood] = useState(existingEntry?.mood || '');
  const [privacy, setPrivacy] = useState<'private' | 'shared'>(existingEntry?.privacy || 'private');
  const [isStory, setIsStory] = useState(existingEntry?.isStory || false);
  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('unsaved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to hold the latest state values for event listeners
  const stateRef = useRef({ title, content, tags, mood, privacy, isStory, tagInput });

  useEffect(() => {
    stateRef.current = { title, content, tags, mood, privacy, isStory, tagInput };
  }, [title, content, tags, mood, privacy, isStory, tagInput]);

  useEffect(() => {
    // Check for content passed from other pages (e.g. Bookshelf)
    const initialContent = localStorage.getItem('diary_initial_content');
    if (initialContent) {
      // Append if content exists, or set if empty. 
      // But usually we are creating a new entry if coming from bookshelf.
      if (!id) {
          setContent(prev => prev ? prev + '\n\n' + initialContent : initialContent);
      }
      localStorage.removeItem('diary_initial_content');
    }
  }, [id]);

  // Fetch location and weather for new entries
  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      // Only fetch for new entries with empty content
      if (id || content.trim()) return;

      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 1. Reverse Geocoding (Nominatim)
          // Use accept-language to try getting Chinese names
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh-CN`);
          const geoData = await geoRes.json();
          const city = geoData.address.city || geoData.address.town || geoData.address.district || geoData.address.county || 'Unknown Location';

          // 2. Weather (OpenMeteo)
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=auto`);
          const weatherData = await weatherRes.json();
          
          if (weatherData.current) {
              const weatherSentence = generateWeatherContent(city, weatherData);
              setContent(prev => weatherSentence + prev);
          }
        } catch (e) {
          console.error("Failed to fetch location/weather", e);
        }
      }, (err) => {
        console.error("Geolocation error", err);
      });
    };

    fetchLocationAndWeather();
  }, [id]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (existingEntry) {
      setHasUnsavedChanges(false);
    }
  }, [existingEntry]);

  useEffect(() => {
    if (title || content) {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
    }
  }, [title, content, tags, mood, privacy, isStory]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const insertTextAtCursor = (text: string, selectionOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    
    setContent(newContent);
    
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
           start + text.length + selectionOffset, 
           start + text.length + selectionOffset
        );
      }
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!emojiData?.emoji) return;
    insertTextAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleInsertLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('text') as string;
    const url = formData.get('url') as string;
    if (url) {
      insertTextAtCursor(`[${text || 'link'}](${url})`);
    }
    setShowLinkPicker(false);
  };

  const handleInsertImage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const alt = formData.get('alt') as string;
    const url = formData.get('url') as string;
    if (url) {
      insertTextAtCursor(`![${alt || 'image'}](${url})`);
    }
    setShowImagePicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (e.g., 2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please choose an image under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          insertTextAtCursor(`![${file.name}](${result})`);
          setShowImagePicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setIsSearchingCity(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=5&accept-language=zh-CN`);
      const data = await res.json();
      setCityResults(data);
    } catch (error) {
      console.error("City search failed", error);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleSelectCity = async (city: any) => {
    const { lat, lon, display_name } = city;
    const cityName = display_name.split(',')[0]; 
    
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=auto`);
        const weatherData = await weatherRes.json();
        
        if (weatherData.current) {
            const weatherSentence = generateWeatherContent(cityName, weatherData);
            insertTextAtCursor(weatherSentence);
        }
    } catch (e) {
        console.error(e);
    }
    setShowWeatherPicker(false);
    setCityResults([]);
    setCityQuery('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition. Please try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN'; // Default to Chinese

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        insertTextAtCursor(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const renderToolbar = () => (
    <div className="flex items-center gap-1 mb-2 relative z-20 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-100 w-fit">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => applyFormat('**')}
        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
        title="Bold (Cmd/Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => applyFormat('*')}
        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
        title="Italic (Cmd/Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowWeatherPicker(!showWeatherPicker);
            setShowLinkPicker(false);
            setShowImagePicker(false);
            setShowEmojiPicker(false);
          }}
          className={`h-8 w-8 p-0 ${showWeatherPicker ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
          title="Insert Weather"
        >
          <CloudSun className="w-4 h-4" />
        </Button>
        {showWeatherPicker && (
          <div className="absolute left-0 top-10 shadow-xl rounded-lg z-50 bg-white border border-slate-200 p-4 w-72">
            <div className="fixed inset-0 z-40" onClick={() => setShowWeatherPicker(false)} />
            <div className="relative z-50 space-y-3">
              <form onSubmit={handleSearchCity} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Search City</Label>
                  <div className="flex gap-2">
                    <Input 
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        placeholder="Beijing, Tokyo..." 
                        className="h-8 text-sm flex-1" 
                        autoFocus 
                    />
                    <Button type="submit" size="sm" className="h-8 w-8 p-0" disabled={isSearchingCity}>
                        {isSearchingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </form>
              
              {cityResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border-t border-slate-100 pt-2">
                      {cityResults.map((city, index) => (
                          <button
                              key={index}
                              onClick={() => handleSelectCity(city)}
                              className="w-full text-left text-sm p-2 hover:bg-slate-50 rounded flex items-start gap-2 transition-colors"
                          >
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-2">{city.display_name}</span>
                          </button>
                      ))}
                  </div>
              )}
              {cityResults.length === 0 && !isSearchingCity && cityQuery && (
                  <p className="text-xs text-slate-400 text-center py-2">No cities found.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-slate-200 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleRecording}
        className={`h-8 w-8 p-0 ${isRecording ? 'bg-red-50 text-red-600 animate-pulse' : 'text-slate-500 hover:text-indigo-600'}`}
        title={isRecording ? "Stop Recording" : "Start Voice Dictation"}
      >
        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowLinkPicker(!showLinkPicker);
            setShowImagePicker(false);
            setShowEmojiPicker(false);
          }}
          className={`h-8 w-8 p-0 ${showLinkPicker ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        {showLinkPicker && (
          <div className="absolute left-0 top-10 shadow-xl rounded-lg z-50 bg-white border border-slate-200 p-4 w-72">
            <div className="fixed inset-0 z-40" onClick={() => setShowLinkPicker(false)} />
            <form onSubmit={handleInsertLink} className="relative z-50 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Link Text</Label>
                <Input name="text" placeholder="Click here" className="h-8 text-sm" autoFocus />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input name="url" placeholder="https://example.com" className="h-8 text-sm" required />
              </div>
              <Button type="submit" size="sm" className="w-full h-8">Insert Link</Button>
            </form>
          </div>
        )}
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowImagePicker(!showImagePicker);
            setShowLinkPicker(false);
            setShowEmojiPicker(false);
          }}
          className={`h-8 w-8 p-0 ${showImagePicker ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        {showImagePicker && (
          <div className="absolute left-0 top-10 shadow-xl rounded-lg z-50 bg-white border border-slate-200 p-4 w-72">
            <div className="fixed inset-0 z-40" onClick={() => setShowImagePicker(false)} />
            <div className="relative z-50 space-y-4">
               <div className="space-y-3">
                 <div className="space-y-1">
                   <Label className="text-xs">Upload Image</Label>
                   <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 gap-2 font-normal"
                      onClick={() => fileInputRef.current?.click()}
                   >
                     <Upload className="w-3.5 h-3.5" />
                     Choose File...
                   </Button>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                   />
                 </div>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Or via URL</span>
                    </div>
                  </div>
                 <form onSubmit={handleInsertImage} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Image URL</Label>
                      <Input name="url" placeholder="https://example.com/image.png" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Alt Text</Label>
                      <Input name="alt" placeholder="Image description" className="h-8 text-sm" />
                    </div>
                    <Button type="submit" size="sm" className="w-full h-8">Insert Image</Button>
                 </form>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-slate-200 mx-1" />

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowLinkPicker(false);
            setShowImagePicker(false);
          }}
          className={`h-8 w-8 p-0 ${showEmojiPicker ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
          title="Insert Emoji"
        >
          <Smile className="w-4 h-4" />
        </Button>
        {showEmojiPicker && (
          <div className="absolute right-0 md:left-0 top-10 shadow-xl rounded-lg z-50">
              <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
              <div className="relative z-50">
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={400}
                />
              </div>
          </div>
        )}
      </div>
    </div>
  );

  const handleSave = useCallback((shouldNavigate: boolean = true) => {
    // Prevent multiple saves if already saving
    if (saveStatus === 'saving') return;

    const currentState = stateRef.current;
    if (!currentState.title.trim() || !currentState.content.trim()) {
      return;
    }

    // Handle pending tag input
    let finalTags = [...currentState.tags];
    const pendingTag = currentState.tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag);
      // Update local state to reflect the change if we stay on page
      setTags(finalTags);
      setTagInput('');
    }

    const entryData = {
      title: currentState.title,
      content: currentState.content,
      tags: finalTags,
      mood: currentState.mood,
      privacy: currentState.privacy,
      isStory: currentState.isStory
    };

    setSaveStatus('saving');
    // Use an async function inside since handleSave is synchronous
    (async () => {
      try {
        if (id && existingEntry) {
          await updateEntry(id, entryData);
        } else {
          await addEntry(entryData);
        }
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        
        if (shouldNavigate) {
            setTimeout(() => {
              navigate('/timeline');
            }, 500);
        }
      } catch (error: any) {
        console.error("Save failed", error);
        setSaveStatus('unsaved');
        alert(error.message || "Failed to save entry");
      }
    })();
  }, [saveStatus, id, existingEntry, updateEntry, addEntry, navigate]);

  // Debounce wrapper for handleSave
  const debouncedSaveRef = useRef<((shouldNavigate: boolean) => void) | null>(null);

  useEffect(() => {
      const handler = (shouldNavigate: boolean) => handleSave(shouldNavigate);
      
      // Simple debounce implementation
      let timeout: NodeJS.Timeout;
      const debounced = (shouldNavigate: boolean) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
              handler(shouldNavigate);
          }, 500); // 500ms debounce
      };
      
      debouncedSaveRef.current = debounced;
      
      return () => clearTimeout(timeout);
  }, [handleSave]);

  const handleDebouncedSave = (shouldNavigate: boolean) => {
      if (debouncedSaveRef.current) {
          debouncedSaveRef.current(shouldNavigate);
      }
  };

  const handleShortcut = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcuts.save.toLowerCase()) {
      e.preventDefault();
      // Debounce manual save shortcut
      handleDebouncedSave(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === shortcuts.saveAndExit) {
        e.preventDefault();
        // Debounce manual save shortcut
        handleDebouncedSave(true);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === shortcuts.bold.toLowerCase()) {
            e.preventDefault();
            applyFormat('**');
        } else if (e.key.toLowerCase() === shortcuts.italic.toLowerCase()) {
            e.preventDefault();
            applyFormat('*');
        }
    }
  };

  const applyFormat = (syntax: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const before = content.substring(0, start);
      const after = content.substring(end);

      const newContent = `${before}${syntax}${selectedText}${syntax}${after}`;
      setContent(newContent);

      requestAnimationFrame(() => {
          if (textareaRef.current) {
              if (start === end) {
                  // If no selection, place cursor inside syntax
                  textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + syntax.length;
              } else {
                  // If selection, select the text inside syntax
                  textareaRef.current.setSelectionRange(start + syntax.length, end + syntax.length);
              }
              textareaRef.current.focus();
          }
      });
  };

  useEffect(() => {
      document.addEventListener('keydown', handleShortcut);
      return () => {
          document.removeEventListener('keydown', handleShortcut);
      };
  }, [shortcuts]); // Re-bind when shortcuts change

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirm) return;
    }
    navigate('/timeline');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-slate-600 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl text-slate-800">{id ? 'Edit Entry' : 'New Entry'}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    Saved
                  </span>
                )}
                {saveStatus === 'saving' && <span>Saving...</span>}
                {saveStatus === 'unsaved' && hasUnsavedChanges && <span>Unsaved changes</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <WritingTimer />
            {/* 新增：Write / Preview 切换按钮 */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('write')}
                    className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${mode === 'write' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Write
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('preview')}
                    className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${mode === 'preview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('split')}
                    className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${mode === 'split' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                    <Columns className="w-3.5 h-3.5 mr-1.5" />
                    Split
                </Button>
            </div>

            <Button
                onClick={() => handleSave(true)}
                disabled={!title.trim() || !content.trim() || saveStatus === 'saving'}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Saving...' : (id ? 'Update Entry' : 'Save Entry')}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main Writing Area */}
          <div className="flex-1 space-y-6">
            <div>
              <Input
                placeholder="Entry title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl border-0 border-b border-slate-200 rounded-none px-0 focus:border-indigo-600 bg-transparent"
              />
            </div>

            <div>
              {mode === 'split' ? (
                <div className="flex gap-4 h-[500px]">
                    <div className="flex-1 relative border-r border-slate-100 pr-4">
                         {renderToolbar()}
                          <Textarea
                            ref={textareaRef}
                            placeholder="Start writing..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleTextareaKeyDown} // Restore keydown handler
                            className="h-full border-0 text-base leading-relaxed resize-none focus:ring-0 bg-transparent p-0 font-mono"
                          />
                    </div>
                    <div className="flex-1 overflow-y-auto prose prose-slate prose-sm max-w-none pt-12">
                         {content.trim() ? (
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                                <p>Preview area</p>
                             </div>
                           )}
                    </div>
                </div>
              ) : mode === 'write' ? (
                <div className="relative">
                  {renderToolbar()}
                  
                  <Textarea
                    ref={textareaRef}
                    placeholder="Start writing your thoughts... (Markdown supported)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    className="min-h-[500px] border-0 text-lg leading-relaxed resize-none focus:ring-0 bg-transparent p-0 font-mono"
                  />
                </div>
              ) : (
                /* 新增：Markdown 预览区域 */
                <div className="min-h-[500px] prose prose-slate prose-lg max-w-none">
                   {content.trim() ? (
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400 italic">
                        <p>Nothing to preview yet...</p>
                        <p className="text-sm mt-2">Switch to Write mode to add content.</p>
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
            <span>{content.length} characters</span>
            <span>{wordCount} words</span>
            <span>{content.split(/\n/).length} lines</span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2">Tags</Label>
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 cursor-pointer hover:bg-slate-200"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-2">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="grateful">Grateful</SelectItem>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="reflective">Reflective</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-2">Privacy</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={privacy === 'private' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPrivacy('private')}
                    className={privacy === 'private' ? 'bg-indigo-600' : ''}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Private
                  </Button>
                  <Button
                    variant={privacy === 'shared' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPrivacy('shared')}
                    className={privacy === 'shared' ? 'bg-indigo-600' : ''}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Shared
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2 pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-600">Daily Story</Label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Post to community ranking (1/day)
                  </p>
                </div>
                <Switch
                  checked={isStory}
                  onCheckedChange={(checked) => {
                    setIsStory(checked);
                    if (checked) setPrivacy('shared');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
