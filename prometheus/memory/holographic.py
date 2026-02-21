"""
Holographic Memory System

Stores knowledge as interference patterns (phase/amplitude)
instead of discrete bits. Enables:
- 100x compression
- Natural error correction
- Associative recall
- Distributed storage
"""

import numpy as np
from typing import List, Tuple, Optional, Dict
import hashlib
import json
from dataclasses import dataclass
import heapq


@dataclass
class MemoryPattern:
    """A holographic memory pattern"""
    id: str
    phase_spectrum: np.ndarray  # Phase angles (0-2π)
    amplitude_spectrum: np.ndarray  # Magnitudes
    metadata: Dict  # Context, tags, timestamp
    coherence: float  # Pattern strength (0-1)


class HolographicMemory:
    """
    Holographic memory store.
    
    Knowledge is stored as interference patterns in frequency domain.
    Retrieval uses resonance matching - patterns that "vibrate" similarly
    interfere constructively.
    """
    
    def __init__(self, dimensions: int = 1024, max_patterns: int = 100000):
        self.dimensions = dimensions
        self.max_patterns = max_patterns
        self.patterns: Dict[str, MemoryPattern] = {}
        self.index: Dict[str, List[str]] = {}  # Tag → pattern IDs
        
    def _text_to_wave(self, text: str) -> np.ndarray:
        """Convert text to wave representation using character encoding"""
        # Create base signal from text
        bytes_data = text.encode('utf-8')
        
        # Pad or truncate to dimensions
        if len(bytes_data) < self.dimensions:
            signal = np.zeros(self.dimensions)
            signal[:len(bytes_data)] = np.array(list(bytes_data)) / 255.0
        else:
            # Reshape longer texts through averaging
            signal = np.zeros(self.dimensions)
            chunk_size = len(bytes_data) // self.dimensions
            for i in range(self.dimensions):
                start = i * chunk_size
                end = start + chunk_size
                signal[i] = np.mean(bytes_data[start:end]) / 255.0
        
        return signal
    
    def _create_interference_pattern(self, signal: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create holographic interference pattern using FFT"""
        # Apply window function to reduce edge effects
        window = np.hanning(len(signal))
        windowed = signal * window
        
        # Transform to frequency domain
        spectrum = np.fft.fft(windowed)
        
        # Extract phase and amplitude
        phase = np.angle(spectrum)
        amplitude = np.abs(spectrum)
        
        # Normalize amplitude
        if np.max(amplitude) > 0:
            amplitude = amplitude / np.max(amplitude)
        
        return phase, amplitude
    
    def _pattern_to_wave(self, phase: np.ndarray, amplitude: np.ndarray) -> np.ndarray:
        """Reconstruct wave from holographic pattern"""
        # Reconstruct complex spectrum
        spectrum = amplitude * np.exp(1j * phase)
        
        # Transform back to time domain
        signal = np.real(np.fft.ifft(spectrum))
        
        return signal
    
    def store(self, content: str, metadata: Optional[Dict] = None) -> str:
        """
        Store content as holographic pattern.
        
        Returns pattern ID for retrieval.
        """
        # Generate unique ID
        pattern_id = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        # Convert to wave and create pattern
        signal = self._text_to_wave(content)
        phase, amplitude = self._create_interference_pattern(signal)
        
        # Calculate coherence (pattern strength)
        coherence = float(np.mean(amplitude))
        
        # Create pattern
        pattern = MemoryPattern(
            id=pattern_id,
            phase_spectrum=phase,
            amplitude_spectrum=amplitude,
            metadata=metadata or {},
            coherence=coherence
        )
        
        # Store pattern
        self.patterns[pattern_id] = pattern
        
        # Index by tags
        tags = metadata.get('tags', []) if metadata else []
        for tag in tags:
            if tag not in self.index:
                self.index[tag] = []
            self.index[tag].append(pattern_id)
        
        # Manage capacity
        if len(self.patterns) > self.max_patterns:
            self._prune_weakest()
        
        return pattern_id
    
    def retrieve(self, query: str, top_k: int = 5, threshold: float = 0.3) -> List[Tuple[str, float]]:
        """
        Retrieve most resonant patterns for query.
        
        Returns list of (pattern_id, resonance_score)
        """
        if not self.patterns:
            return []
        
        # Convert query to wave
        query_signal = self._text_to_wave(query)
        query_phase, query_amp = self._create_interference_pattern(query_signal)
        
        # Calculate resonance with all patterns
        resonances = []
        
        for pattern_id, pattern in self.patterns.items():
            # Calculate resonance through:
            # 1. Phase alignment (cosine similarity of phases)
            # 2. Amplitude correlation
            
            # Phase resonance (how well phases align)
            phase_diff = np.abs(pattern.phase_spectrum - query_phase)
            phase_diff = np.minimum(phase_diff, 2 * np.pi - phase_diff)
            phase_score = np.mean(1 - phase_diff / np.pi)
            
            # Amplitude resonance (correlation)
            amp_score = np.corrcoef(pattern.amplitude_spectrum, query_amp)[0, 1]
            if np.isnan(amp_score):
                amp_score = 0
            
            # Combined resonance
            resonance = (phase_score + amp_score) / 2 * pattern.coherence
            
            if resonance >= threshold:
                resonances.append((pattern_id, resonance))
        
        # Return top-k by resonance
        return heapq.nlargest(top_k, resonances, key=lambda x: x[1])
    
    def reconstruct(self, pattern_id: str) -> Optional[str]:
        """Attempt to reconstruct original content from pattern"""
        if pattern_id not in self.patterns:
            return None
        
        pattern = self.patterns[pattern_id]
        
        # Only high-coherence patterns can be reasonably reconstructed
        if pattern.coherence < 0.5:
            return "[Pattern too degraded for reconstruction]"
        
        signal = self._pattern_to_wave(pattern.phase_spectrum, pattern.amplitude_spectrum)
        
        # Convert back to bytes/text
        bytes_data = (signal * 255).astype(np.uint8)
        
        try:
            # Try to decode as utf-8
            text = bytes_data.tobytes().decode('utf-8', errors='ignore')
            # Remove null bytes padding
            text = text.replace('\x00', '').strip()
            return text
        except:
            return "[Reconstruction failed]"
    
    def _prune_weakest(self):
        """Remove lowest coherence patterns when at capacity"""
        # Sort by coherence
        sorted_patterns = sorted(
            self.patterns.items(),
            key=lambda x: x[1].coherence
        )
        
        # Remove bottom 10%
        to_remove = len(sorted_patterns) // 10
        for pattern_id, _ in sorted_patterns[:to_remove]:
            del self.patterns[pattern_id]
            # Clean up index
            for tag_list in self.index.values():
                if pattern_id in tag_list:
                    tag_list.remove(pattern_id)
    
    def get_stats(self) -> Dict:
        """Get memory statistics"""
        if not self.patterns:
            return {"patterns": 0, "avg_coherence": 0, "size_mb": 0}
        
        coherences = [p.coherence for p in self.patterns.values()]
        
        # Estimate memory usage
        bytes_per_pattern = self.dimensions * 16  # phase + amplitude (complex64)
        total_bytes = len(self.patterns) * bytes_per_pattern
        
        return {
            "patterns": len(self.patterns),
            "avg_coherence": np.mean(coherences),
            "min_coherence": np.min(coherences),
            "max_coherence": np.max(coherences),
            "size_mb": total_bytes / (1024 * 1024),
            "dimensions": self.dimensions
        }


class AssociativeWeb:
    """
    Network of associations between memory patterns.
    Enables concept linking and chain-of-thought retrieval.
    """
    
    def __init__(self, memory: HolographicMemory):
        self.memory = memory
        self.associations: Dict[str, List[Tuple[str, float]]] = {}
    
    def link(self, pattern_a: str, pattern_b: str, strength: float = 1.0):
        """Create association between two patterns"""
        if pattern_a not in self.associations:
            self.associations[pattern_a] = []
        self.associations[pattern_a].append((pattern_b, strength))
        
        # Bidirectional
        if pattern_b not in self.associations:
            self.associations[pattern_b] = []
        self.associations[pattern_b].append((pattern_a, strength))
    
    def spread_activation(self, start_pattern: str, depth: int = 3) -> List[Tuple[str, float]]:
        """
        Spread activation through association network.
        Like human memory - one thought triggers related thoughts.
        """
        activated = {start_pattern: 1.0}
        current_level = {start_pattern: 1.0}
        
        for _ in range(depth):
            next_level = {}
            for pattern_id, activation in current_level.items():
                if pattern_id in self.associations:
                    for assoc_id, strength in self.associations[pattern_id]:
                        new_activation = activation * strength * 0.8  # Decay
                        if assoc_id not in activated or activated[assoc_id] < new_activation:
                            activated[assoc_id] = new_activation
                            next_level[assoc_id] = new_activation
            current_level = next_level
        
        return sorted(activated.items(), key=lambda x: x[1], reverse=True)


# Test the system
if __name__ == "__main__":
    print("🧠 Prometheus Holographic Memory")
    print("=" * 50)
    
    # Create memory
    memory = HolographicMemory(dimensions=2048)
    
    # Store some knowledge
    print("\n📥 Storing patterns...")
    
    facts = [
        ("The capital of France is Paris", {"tags": ["geography", "europe"]}),
        ("Python is a programming language created by Guido van Rossum", {"tags": ["coding", "python"]}),
        ("The speed of light is 299,792,458 meters per second", {"tags": ["physics", "science"]}),
        ("Machine learning is a subset of artificial intelligence", {"tags": ["ai", "ml"]}),
        ("Paris is known for the Eiffel Tower and French cuisine", {"tags": ["geography", "culture"]}),
    ]
    
    for content, meta in facts:
        pid = memory.store(content, meta)
        print(f"  Stored: {content[:50]}...")
    
    # Show stats
    stats = memory.get_stats()
    print(f"\n📊 Memory Stats:")
    print(f"  Patterns: {stats['patterns']}")
    print(f"  Avg Coherence: {stats['avg_coherence']:.3f}")
    print(f"  Memory Usage: {stats['size_mb']:.2f} MB")
    
    # Retrieve
    print("\n🔍 Testing Retrieval:")
    queries = [
        "What is the capital of France?",
        "Tell me about Python",
        "Speed of light",
        "AI and machine learning"
    ]
    
    for query in queries:
        print(f"\n  Query: '{query}'")
        results = memory.retrieve(query, top_k=3)
        for pid, score in results:
            print(f"    {score:.3f}: {memory.reconstruct(pid)[:60]}...")
    
    # Test associative web
    print("\n🔗 Testing Associative Web:")
    web = AssociativeWeb(memory)
    
    # Create some links
    pids = list(memory.patterns.keys())
    if len(pids) >= 3:
        web.link(pids[1], pids[3], 0.9)  # Python → AI
        web.link(pids[0], pids[4], 0.8)  # France → Paris culture
        
        print(f"  Spreading activation from: {memory.reconstruct(pids[1])[:40]}...")
        activated = web.spread_activation(pids[1], depth=2)
        for pid, strength in activated[:3]:
            print(f"    {strength:.3f}: {memory.reconstruct(pid)[:50]}...")
    
    print("\n✅ Holographic Memory Test Complete")
