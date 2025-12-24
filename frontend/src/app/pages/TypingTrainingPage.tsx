import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { RotateCcw, Trophy, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// --- Types & Constants ---

type KeyProps = {
  label: string;
  position: [number, number, number];
  width: number;
  depth?: number;
  isPressed: boolean;
  isActive: boolean;
  isError: boolean;
};

const SAMPLE_TEXTS_EN = [
  "The quick brown fox jumps over the lazy dog.", // 44
  "Pack my box with five dozen liquor jugs.", // 40
  "Sphinx of black quartz, judge my vow.", // 37
  "Success is not final, failure is not fatal.", // 43
  "React makes it painless to create interactive UIs.", // 50
  "A journey of a thousand miles begins with a step.", // 48
  "In the middle of difficulty lies opportunity.", // 44
  "Believe you can and you're halfway there.", // 41
  "It does not matter how slowly you go so long.", // 45
  "Happiness depends upon ourselves alone." // 39
];

const SAMPLE_TEXTS_ZH = [
  "即使在最黑暗的时刻，也要看到希望的光芒。", // 20 - slightly short but okay for Chinese
  "生活不是等待风暴过去，而是学会在雨中翩翩起舞。", // 24
  "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪。", // 26
  "海内存知己，天涯若比邻。无为在歧路，儿女共沾巾。", // 26
  "落霞与孤鹜齐飞，秋水共长天一色。", // 16
  "不积跬步，无以至千里；不积小流，无以成江海。", // 24
  "只有经历过地狱般的磨练，才能练就创造天堂的力量。", // 26
  "世界上最快乐的事，莫过于为理想而奋斗。", // 20
  "既然选择了远方，便只顾风雨兼程。", // 16
  "种一棵树最好的时间是十年前，其次是现在。" // 20
];
// Note: User asked for 30-50 chars. Chinese chars are denser. 
// I will concatenate some short poems or use longer prose for ZH to meet ~30 range.
const SAMPLE_TEXTS_ZH_LONG = [
    "即使在最黑暗的时刻，也要看到希望的光芒，因为星星在黑暗中才会闪烁。", // 33
    "生活不是等待风暴过去，而是学会在雨中翩翩起舞，享受每一刻的生命。", // 32
    "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。", // 32
    "海内存知己，天涯若比邻。无为在歧路，儿女共沾巾。天下谁人不识君。", // 33
    "不积跬步，无以至千里；不积小流，无以成江海。骐骥一跃，不能十步。", // 33
    "只有经历过地狱般的磨练，才能练就创造天堂的力量；只有流过血的手指。", // 34
    "世界上最快乐的事，莫过于为理想而奋斗，为自己的目标而努力不懈。", // 31
    "既然选择了远方，便只顾风雨兼程，留给世界的只能是背影。", // 27
    "种一棵树最好的时间是十年前，其次是现在。只要开始，永远都不晚。", // 31
    "欲穷千里目，更上一层楼。会当凌绝顶，一览众山小。" // 26
];

const KEY_LAYOUT = [
  [
    { label: '`', width: 1 }, { label: '1', width: 1 }, { label: '2', width: 1 }, { label: '3', width: 1 }, { label: '4', width: 1 },
    { label: '5', width: 1 }, { label: '6', width: 1 }, { label: '7', width: 1 }, { label: '8', width: 1 }, { label: '9', width: 1 },
    { label: '0', width: 1 }, { label: '-', width: 1 }, { label: '=', width: 1 }, { label: 'Backspace', width: 2 }
  ],
  [
    { label: 'Tab', width: 1.5 }, { label: 'q', width: 1 }, { label: 'w', width: 1 }, { label: 'e', width: 1 }, { label: 'r', width: 1 },
    { label: 't', width: 1 }, { label: 'y', width: 1 }, { label: 'u', width: 1 }, { label: 'i', width: 1 }, { label: 'o', width: 1 },
    { label: 'p', width: 1 }, { label: '[', width: 1 }, { label: ']', width: 1 }, { label: '\\', width: 1.5 }
  ],
  [
    { label: 'Caps', width: 1.8 }, { label: 'a', width: 1 }, { label: 's', width: 1 }, { label: 'd', width: 1 }, { label: 'f', width: 1 },
    { label: 'g', width: 1 }, { label: 'h', width: 1 }, { label: 'j', width: 1 }, { label: 'k', width: 1 }, { label: 'l', width: 1 },
    { label: ';', width: 1 }, { label: "'", width: 1 }, { label: 'Enter', width: 2.2 }
  ],
  [
    { label: 'Shift', width: 2.3 }, { label: 'z', width: 1 }, { label: 'x', width: 1 }, { label: 'c', width: 1 }, { label: 'v', width: 1 },
    { label: 'b', width: 1 }, { label: 'n', width: 1 }, { label: 'm', width: 1 }, { label: ',', width: 1 }, { label: '.', width: 1 },
    { label: '/', width: 1 }, { label: 'ShiftR', width: 2.7 }
  ],
  [
    { label: 'Ctrl', width: 1.5 }, { label: 'Win', width: 1.25 }, { label: 'Alt', width: 1.25 },
    { label: 'Space', width: 6.5 },
    { label: 'Alt', width: 1.25 }, { label: 'Win', width: 1.25 }, { label: 'Menu', width: 1.25 }, { label: 'Ctrl', width: 1.5 }
  ]
];

// Map real key events to our layout labels
const KEY_MAP: Record<string, string> = {
  ' ': 'Space',
  'Control': 'Ctrl',
  'Meta': 'Win',
  'AltGraph': 'Alt',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
  'CapsLock': 'Caps',
  'Shift': 'Shift', // Will handle L/R if needed, but for now simple
  'Enter': 'Enter',
  'Backspace': 'Backspace',
  'Tab': 'Tab',
  'Escape': 'Esc'
};

const SHIFT_MAP: Record<string, string> = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
};

// --- 3D Components ---

const Key3D = ({ label, position, width, depth = 1, isPressed, isActive, isError }: KeyProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetY = isPressed ? -0.15 : 0;
  
  // Animation loop
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly interpolate position
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.2);
    }
  });

  // Colors
  const baseColor = isActive ? (isError ? '#ef4444' : '#0ea5e9') : '#334155'; // Red if error, Blue if active, else Slate
  const topColor = isActive ? (isError ? '#f87171' : '#38bdf8') : '#1e293b';
  const textColor = isActive ? '#ffffff' : '#94a3b8';

  return (
    <group ref={meshRef} position={position}>
      {/* Key Cap */}
      <RoundedBox args={[width * 0.9, 0.5, depth * 0.9]} radius={0.05} smoothness={4} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.1} />
      </RoundedBox>
      
      {/* Key Base/Switch */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[width * 0.8, 0.2, depth * 0.8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Label */}
      <Text
        position={[-width * 0.3, 0.51, -depth * 0.3]} // Top-left corner style
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={textColor}
        anchorX="left"
        anchorY="top"
      >
        {label === 'ShiftR' ? 'Shift' : label}
      </Text>
    </group>
  );
};

const Keyboard3D = ({ activeKey, pressedKeys, isError }: { activeKey: string | null, pressedKeys: Set<string>, isError: boolean }) => {
  // Generate key positions
  const keys: JSX.Element[] = [];
  const startX = -7.5;
  const startZ = -2.5;
  let currentZ = startZ;

  KEY_LAYOUT.forEach((row, rowIndex) => {
    let currentX = startX;
    row.forEach((key) => {
      // Determine center position of the key
      const keyCenterX = currentX + (key.width / 2);
      
      // Check if this key is active (next to type) or pressed
      // We need to normalize labels for comparison
      const normalizeLabel = (l: string) => l.toLowerCase();
      
      // Simple matching logic
      const isPressed = pressedKeys.has(key.label) || pressedKeys.has(key.label.toLowerCase()) || (key.label === 'ShiftR' && pressedKeys.has('Shift'));
      
      let isActive = false;
      if (activeKey) {
        const targetBaseKey = SHIFT_MAP[activeKey] || activeKey;
        
        // Match base key (case-insensitive for letters, exact for symbols handled by map)
        if (key.label === targetBaseKey || key.label.toLowerCase() === targetBaseKey.toLowerCase()) {
            isActive = true;
        }
        
        // Special case for Space
        if (activeKey === ' ' && key.label === 'Space') isActive = true;

        // Check if we need Shift (Uppercase or symbol in SHIFT_MAP)
        const needsShift = /^[A-Z]$/.test(activeKey) || SHIFT_MAP[activeKey] !== undefined;
        if (needsShift && (key.label === 'Shift' || key.label === 'ShiftR')) {
            isActive = true;
        }
      }

      keys.push(
        <Key3D
          key={`${rowIndex}-${key.label}`}
          label={key.label}
          position={[keyCenterX, 0, currentZ]}
          width={key.width}
          isPressed={isPressed}
          isActive={isActive}
          isError={isActive && isError}
        />
      );
      currentX += key.width + 0.1; // Gap
    });
    currentZ += 1.1; // Row gap
  });

  return (
    <group>
      {/* Keyboard Base */}
      <RoundedBox args={[16, 0.5, 6]} radius={0.2} smoothness={4} position={[0, -0.25, -0.3]}>
         <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.5} />
      </RoundedBox>
      {keys}
    </group>
  );
};

// --- Main Page Component ---

const TypingTrainingPage = () => {
  // Game State
  const [text, setText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [isErrorState, setIsErrorState] = useState(false);
  const [todayTyped, setTodayTyped] = useState(0);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);

  // Load daily stats on mount
  useEffect(() => {
    const saved = localStorage.getItem('diary_today_typed');
    const savedDate = localStorage.getItem('diary_today_typed_date');
    const today = new Date().toDateString();

    if (saved && savedDate === today) {
      setTodayTyped(parseInt(saved, 10));
    } else {
      setTodayTyped(0);
      localStorage.setItem('diary_today_typed_date', today);
    }
    
    startNewGame();
  }, [language]);

  // Keep input focused
  useEffect(() => {
    const focusInput = () => {
        if (!endTime) inputRef.current?.focus();
    };
    window.addEventListener('click', focusInput);
    focusInput();
    return () => window.removeEventListener('click', focusInput);
  }, [endTime]);

  const startNewGame = () => {
    isComposing.current = false;
    const texts = language === 'en' ? SAMPLE_TEXTS_EN : SAMPLE_TEXTS_ZH_LONG;
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    setText(randomText);
    setCurrentIndex(0);
    setErrors(0);
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsErrorState(false);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    // Validate immediately on composition end because onChange might have fired before
    // or we want to ensure the final committed value is checked.
    // However, e.currentTarget.value contains the full text.
    handleInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (endTime) return;

    // If composing, just update value to show IME process, don't validate yet
    // Unless this is called from handleCompositionEnd (where isComposing is false)
    if (isComposing.current) {
        setInputValue(e.target.value);
        return;
    }

    const newValue = e.target.value;
    
    // Start timer logic
    if (!startTime && newValue.length > 0) {
      setStartTime(Date.now());
    }

    // Allow backspace (if length decreased)
    if (newValue.length < inputValue.length) {
       // Only allow backspace if we are correcting the last typed char or if it was an error?
       // Actually, we should allow user to backspace freely in the input.
       // Sync currentIndex with input length
       setInputValue(newValue);
       setCurrentIndex(newValue.length);
       setIsErrorState(false);
       return;
    }

    // If adding characters
    const charIndex = newValue.length - 1;
    
    // Boundary check
    if (charIndex >= text.length) {
        return; // Don't allow typing past end
    }

    const typedChar = newValue[charIndex];
    const targetChar = text[charIndex];

    if (typedChar === targetChar) {
        // Correct
        setInputValue(newValue);
        setCurrentIndex(newValue.length);
        setIsErrorState(false);

        // Update total
        const newTotal = todayTyped + 1;
        setTodayTyped(newTotal);
        localStorage.setItem('diary_today_typed', newTotal.toString());

        // Check completion
        if (newValue.length === text.length) {
            const end = Date.now();
            setEndTime(end);
            calculateStats(end, errors, text.length);
            toast.success("Completed! Nice typing.");
        } else {
            calculateStats(Date.now(), errors, newValue.length);
        }
    } else {
        // Incorrect - BLOCK INPUT
        // Do NOT update inputValue to the wrong character.
        // Revert to the last correct state (text up to currentIndex)
        // This effectively "blocks" the wrong character from being committed.
        setInputValue(text.slice(0, currentIndex));
        
        // Mark error state for visual feedback
        setIsErrorState(true);
        setErrors(prev => prev + 1);
        calculateStats(Date.now(), errors + 1, currentIndex);
    }
  };

  // Keyboard Listeners (Visualization Only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Space/Arrows
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         // Don't prevent default if we want the input to receive them?
         // Actually, if input is focused, we shouldn't prevent default unless it scrolls the page.
         // Let's rely on input focus.
      }

      const key = KEY_MAP[e.key] || e.key;
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(key.toLowerCase());
        return newSet;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.key] || e.key;
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key.toLowerCase());
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const calculateStats = (now: number, currentErrors: number, currentTyped: number) => {
     if (!startTime) return;
     const timeInMinutes = (now - startTime) / 60000;
     // Standard WPM = (all typed / 5) / time
     const grossWpm = (currentTyped / 5) / (timeInMinutes || 0.001); // Avoid div by zero
     setWpm(Math.round(grossWpm));

     const acc = currentTyped === 0 ? 100 : Math.round(((currentTyped - currentErrors) / currentTyped) * 100);
     setAccuracy(Math.max(0, acc));
  };

  const activeChar = text[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Stats */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900 border-b border-slate-800">
        <div className="col-span-2 md:col-span-1 flex items-center gap-3">
             <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'zh')}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文 (Chinese)</SelectItem>
                </SelectContent>
             </Select>
        </div>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Trophy className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-400">WPM</p>
                <p className="text-xl font-bold font-mono">{wpm}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Activity className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-400">Accuracy</p>
                <p className="text-xl font-bold font-mono">{accuracy}%</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-400">Errors</p>
                <p className="text-xl font-bold font-mono text-red-400">{errors}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <div className="w-5 h-5 text-center font-bold text-xs flex items-center justify-center border border-current rounded">T</div>
            </div>
            <div>
                <p className="text-xs text-slate-400">Today's Total</p>
                <p className="text-xl font-bold font-mono">{todayTyped}</p>
            </div>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Text Area - Top Half */}
        <div className="w-full max-w-4xl px-4 py-8 z-10 relative">
             {/* Hidden Input for IME Support */}
             <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className="opacity-0 absolute inset-0 w-full h-full cursor-default z-0"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
             />
             <Card className="bg-slate-900/80 backdrop-blur border-slate-700 p-8 shadow-2xl min-h-[150px] flex flex-col justify-center items-center relative pointer-events-none">
                <div className="text-2xl md:text-3xl font-mono leading-relaxed tracking-wide text-slate-500 break-words text-center">
                    {text.split('').map((char, idx) => {
                        let colorClass = "";
                        let bgClass = "";
                        
                        if (idx < currentIndex) {
                            colorClass = "text-indigo-400"; // Typed
                        } else if (idx === currentIndex) {
                            colorClass = isErrorState ? "text-red-500" : "text-white";
                            bgClass = isErrorState ? "bg-red-500/20" : "bg-indigo-500/20"; // Cursor
                        }
                        
                        return (
                            <span key={idx} className={`${colorClass} ${bgClass} rounded px-0.5 transition-colors duration-100`}>
                                {char}
                            </span>
                        );
                    })}
                </div>
                {endTime && (
                    <div className="mt-6 flex justify-center pointer-events-auto z-20">
                        <Button onClick={startNewGame} className="gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Play Again
                        </Button>
                    </div>
                )}
             </Card>
        </div>

        {/* 3D Scene - Bottom Half */}
        <div className="w-full flex-1 min-h-[400px] relative pointer-events-none">
            <Canvas camera={{ position: [0, 5, 6], fov: 60 }}>
                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    
                    <group scale={1.5}>
                        <Keyboard3D 
                            activeKey={activeChar} 
                            pressedKeys={pressedKeys}
                            isError={isErrorState}
                        />
                    </group>
                    
                    <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={30} blur={2} far={4.5} />
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        minPolarAngle={Math.PI / 6} 
                        maxPolarAngle={Math.PI / 2.5}
                        minDistance={3}
                        maxDistance={20}
                        target={[0, 0, 0]}
                    />
                </Suspense>
            </Canvas>
        </div>
      </div>
      
      {/* Instructions Footer */}
      <div className="p-4 text-center text-slate-500 text-sm bg-slate-900 border-t border-slate-800">
        Type the text above. Red highlight indicates an error.
      </div>
    </div>
  );
};

export default TypingTrainingPage;
