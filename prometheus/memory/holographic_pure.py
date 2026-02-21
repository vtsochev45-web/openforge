"""
Holographic Memory - Pure Python Implementation (No dependencies)
"""

import math
import hashlib
import json
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
import heapq


@dataclass
class MemoryPattern:
    """A holographic memory pattern using pure Python"""
    id: str
    phase_spectrum: List[float]
    amplitude_spectrum: List[float]
    metadata: Dict
    coherence: float


class HolographicMemory:
    """
    Holographic memory store - Pure Python implementation.
    """
    
    def __init__(self, dimensions: int = 1024, max_patterns: int = 100000):
        self.dimensions = dimensions
        self.max_patterns = max_patterns
        self.patterns: Dict[str, MemoryPattern] = {}
        self.index: Dict[str, List[str]] = {}
        
    def _dft(self, signal: List[float]) -> Tuple[List[float], List[float]]:
        """Discrete Fourier Transform (pure Python)"""
        n = len(signal)
        real = [0.0] * n
        imag = [0.0] * n
        
        for k in range(n):
            for t in range(n):
                angle = -2 * math.pi * k * t / n
                real[k] += signal[t] * math.cos(angle)
                imag[k] += signal[t] * math.sin(angle)
        
        # Convert to polar (phase and amplitude)
        phase = []
        amplitude = []
        for k in range(n):
            amp = math.sqrt(real[k]**2 + imag[k]**2)
            ph = math.atan2(imag[k], real[k])
            phase.append(ph)
            amplitude.append(amp)
        
        # Normalize amplitude
        max_amp = max(amplitude) if amplitude else 1
        amplitude = [a / max_amp for a in amplitude]
        
        return phase, amplitude
    
    def _inverse_dft(self, phase: List[float], amplitude: List[float]) -> List[float]:
        """Inverse DFT"""
        n = len(phase)
        signal = [0.0] * n
        
        for t in range(n):
            for k in range(n):
                real = amplitude[k] * math.cos(phase[k])
                imag = amplitude[k] * math.sin(phase[k])
                angle = 2 * math.pi * k * t / n
                signal[t] += (real * math.cos(angle) - imag * math.sin(angle))
        
        return [s / n for s in signal]
    
    def _text_to_wave(self, text: str) -> List[float]:
        """Convert text to wave representation"""
        bytes_data = text.encode('utf-8')
        
        if len(bytes_data) < self.dimensions:
            signal = [0.0] * self.dimensions
            for i, b in enumerate(bytes_data):
                signal[i] = b / 255.0
        else:
            signal = []
            chunk_size = len(bytes_data) // self.dimensions
            for i in range(self.dimensions):
                start = i * chunk_size
                end = min(start + chunk_size, len(bytes_data))
                chunk = bytes_data[start:end]
                avg = sum(chunk) / len(chunk) if chunk else 0
                signal.append(avg / 255.0)
        
        return signal
    
    def store(self, content: str, metadata: Optional[Dict] = None) -> str:
        """Store content as holographic pattern"""
        pattern_id = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        signal = self._text_to_wave(content)
        phase, amplitude = self._dft(signal)
        
        coherence = sum(amplitude) / len(amplitude) if amplitude else 0
        
        pattern = MemoryPattern(
            id=pattern_id,
            phase_spectrum=phase,
            amplitude_spectrum=amplitude,
            metadata=metadata or {},
            coherence=coherence
        )
        
        self.patterns[pattern_id] = pattern
        
        tags = metadata.get('tags', []) if metadata else []
        for tag in tags:
            if tag not in self.index:
                self.index[tag] = []
            self.index[tag].append(pattern_id)
        
        if len(self.patterns) > self.max_patterns:
            self._prune_weakest()
        
        return pattern_id
    
    def retrieve(self, query: str, top_k: int = 5, threshold: float = 0.3) -> List[Tuple[str, float]]:
        """Retrieve most resonant patterns"""
        if not self.patterns:
            return []
        
        query_signal = self._text_to_wave(query)
        query_phase, query_amp = self._dft(query_signal)
        
        resonances = []
        
        for pattern_id, pattern in self.patterns.items():
            # Phase resonance
            phase_diffs = []
            for p1, p2 in zip(pattern.phase_spectrum, query_phase):
                diff = abs(p1 - p2)
                diff = min(diff, 2 * math.pi - diff)
                phase_diffs.append(diff)
            
            phase_score = sum(1 - d / math.pi for d in phase_diffs) / len(phase_diffs)
            
            # Amplitude correlation
            mean_p = sum(pattern.amplitude_spectrum) / len(pattern.amplitude_spectrum)
            mean_q = sum(query_amp) / len(query_amp)
            
            numerator = sum((p - mean_p) * (q - mean_q) 
                          for p, q in zip(pattern.amplitude_spectrum, query_amp))
            
            denom_p = math.sqrt(sum((p - mean_p)**2 for p in pattern.amplitude_spectrum))
            denom_q = math.sqrt(sum((q - mean_q)**2 for q in query_amp))
            
            amp_score = numerator / (denom_p * denom_q) if denom_p * denom_q > 0 else 0
            
            # Combined
            resonance = (phase_score + amp_score) / 2 * pattern.coherence
            
            if resonance >= threshold:
                resonances.append((pattern_id, resonance))
        
        return heapq.nlargest(top_k, resonances, key=lambda x: x[1])
    
    def reconstruct(self, pattern_id: str) -> Optional[str]:
        """Reconstruct original content"""
        if pattern_id not in self.patterns:
            return None
        
        pattern = self.patterns[pattern_id]
        
        if pattern.coherence < 0.5:
            return "[Pattern degraded]"
        
        signal = self._inverse_dft(pattern.phase_spectrum, pattern.amplitude_spectrum)
        bytes_data = bytes(int(s * 255) for s in signal)
        
        try:
            text = bytes_data.decode('utf-8', errors='ignore')
            text = text.replace('\x00', '').strip()
            return text
        except:
            return "[Reconstruction failed]"
    
    def _prune_weakest(self):
        """Remove weakest patterns"""
        sorted_patterns = sorted(
            self.patterns.items(),
            key=lambda x: x[1].coherence
        )
        
        to_remove = len(sorted_patterns) // 10
        for pattern_id, _ in sorted_patterns[:to_remove]:
            del self.patterns[pattern_id]
            for tag_list in self.index.values():
                if pattern_id in tag_list:
                    tag_list.remove(pattern_id)
    
    def get_stats(self) -> Dict:
        """Get memory statistics"""
        if not self.patterns:
            return {"patterns": 0, "avg_coherence": 0}
        
        coherences = [p.coherence for p in self.patterns.values()]
        
        return {
            "patterns": len(self.patterns),
            "avg_coherence": sum(coherences) / len(coherences),
            "size_kb": len(self.patterns) * self.dimensions * 8 / 1024
        }


# Test
if __name__ == "__main__":
    print("🧠 Prometheus Holographic Memory (Pure Python)")
    print("=" * 50)
    
    memory = HolographicMemory(dimensions=512)
    
    print("\n📥 Storing patterns...")
    facts = [
        ("The capital of France is Paris", {"tags": ["geography"]}),
        ("Python was created by Guido van Rossum", {"tags": ["coding"]}),
        ("Speed of light is 299792458 m/s", {"tags": ["physics"]}),
        ("Machine learning is AI subset", {"tags": ["ai"]}),
    ]
    
    for content, meta in facts:
        pid = memory.store(content, meta)
        print(f"  ✓ Stored: {content[:40]}...")
    
    stats = memory.get_stats()
    print(f"\n📊 Stats: {stats['patterns']} patterns, {stats['avg_coherence']:.2f} coherence")
    
    print("\n🔍 Testing retrieval:")
    queries = [
        "What is Paris?",
        "Tell me about Python",
        "Light speed",
        "AI and ML"
    ]
    
    for query in queries:
        print(f"\n  Query: '{query}'")
        results = memory.retrieve(query, top_k=2)
        for pid, score in results:
            print(f"    {score:.3f}: {memory.reconstruct(pid)[:50]}...")
    
    print("\n✅ Test complete!")
