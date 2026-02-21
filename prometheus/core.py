"""
Prometheus Core - Integration Layer

Combines all layers:
1. Holographic Memory (storage)
2. Fractal Reasoning (thinking)
3. Swarm Intelligence (specialists)
4. Internet Navigation (external knowledge)
"""

import sys
sys.path.insert(0, '/home/tim/.openclaw/workspace/prometheus')

from memory.holographic_pure import HolographicMemory
from reasoning.fractal import FractalReasoner, ThoughtType
from swarm.network import SwarmIntelligence, create_default_swarm, Specialist, SpecialistType
from typing import Dict, List, Optional, Any
import json


class Prometheus:
    """
    The complete synthesis.
    
    Personal AI with:
    - Holographic memory (associative recall)
    - Fractal reasoning (recursive thinking)
    - Swarm intelligence (specialist consensus)
    - Continuous learning (synthetic training)
    """
    
    def __init__(self, memory_dimensions: int = 1024):
        # Layer 1: Memory
        self.memory = HolographicMemory(dimensions=memory_dimensions)
        
        # Layer 2: Reasoning
        self.reasoner = FractalReasoner(
            max_depth=4,
            min_confidence=0.6,
            specialist_registry=self._create_reasoning_specialists()
        )
        
        # Layer 3: Swarm
        self.swarm = create_default_swarm()
        self._add_memory_specialist()
        
        # Stats
        self.query_count = 0
        self.session_start = True
        
    def _create_reasoning_specialists(self) -> Dict[str, Any]:
        """Create specialists for the fractal reasoner"""
        return {
            "code": lambda x: self._code_helper(x),
            "math": lambda x: self._math_helper(x),
            "retrieve": lambda x: self._memory_retrieve(x),
        }
    
    def _add_memory_specialist(self):
        """Add holographic memory as a swarm specialist"""
        def memory_respond(query: str) -> str:
            results = self.memory.retrieve(query, top_k=3, threshold=0.1)
            if results:
                best_id, score = results[0]
                content = self.memory.reconstruct(best_id)
                return f"[Memory: {content[:100]}... (score: {score:.2f})]"
            return "[No relevant memory]"
        
        self.swarm.register(Specialist(
            id="memory_1",
            specialist_type=SpecialistType.MEMORY,
            capability_score=0.8,
            response_fn=memory_respond,
            vote_weight=1.1
        ))
    
    def _code_helper(self, query: str) -> str:
        """Generate code using swarm"""
        result = self.swarm.query(query, max_rounds=1)
        return result["consensus"]["response"]
    
    def _math_helper(self, query: str) -> str:
        """Solve math using swarm"""
        result = self.swarm.query(query, max_rounds=1)
        return result["consensus"]["response"]
    
    def _memory_retrieve(self, query: str) -> str:
        """Retrieve from holographic memory"""
        results = self.memory.retrieve(query, top_k=1, threshold=0.1)
        if results:
            pid, score = results[0]
            return self.memory.reconstruct(pid) or "[Memory retrieval failed]"
        return "[No memory match]"
    
    def think(self, query: str, store_result: bool = True) -> Dict[str, Any]:
        """
        Complete thinking pipeline:
        
        1. Check holographic memory (fast recall)
        2. Use fractal reasoning (structured thinking)
        3. Consult swarm specialists (consensus)
        4. Store in memory (learn)
        """
        self.query_count += 1
        
        # Step 1: Memory recall
        memory_results = self.memory.retrieve(query, top_k=3, threshold=0.15)
        
        # Step 2: Fractal reasoning
        reasoning_tree = self.reasoner.reason(query)
        
        # Step 3: Swarm consensus (if reasoning confidence low)
        final_confidence = reasoning_tree.confidence
        swarm_result = None
        
        if final_confidence < 0.7:
            swarm_result = self.swarm.query(query, max_rounds=2)
            final_confidence = swarm_result["consensus"]["confidence"]
        
        # Step 4: Synthesize final response
        response = self._synthesize_response(
            query, reasoning_tree, swarm_result, memory_results
        )
        
        # Step 5: Store in memory (learn)
        if store_result:
            self.memory.store(
                content=f"Q: {query} | A: {response}",
                metadata={
                    "type": "qa_pair",
                    "query": query,
                    "response": response,
                    "confidence": final_confidence
                }
            )
        
        return {
            "query": query,
            "response": response,
            "confidence": final_confidence,
            "reasoning_tree": reasoning_tree.to_dict(),
            "swarm_result": swarm_result,
            "memory_hits": len(memory_results),
            "query_number": self.query_count
        }
    
    def _synthesize_response(self, query: str, reasoning_tree, swarm_result, memory_results) -> str:
        """Combine all sources into final response"""
        parts = []
        
        # Priority 1: High-confidence memory
        if memory_results and memory_results[0][1] > 0.5:
            pid, score = memory_results[0]
            memory_content = self.memory.reconstruct(pid)
            if memory_content and len(memory_content) > 20:
                parts.append(f"[From memory]: {memory_content[:200]}")
        
        # Priority 2: Swarm consensus
        if swarm_result and swarm_result["consensus"]["confidence"] > 0.5:
            parts.append(f"{swarm_result['consensus']['response'][:300]}")
        
        # Priority 3: Reasoning synthesis
        if reasoning_tree.sub_thoughts:
            # Extract final synthesis
            synth_thoughts = [t for t in reasoning_tree.sub_thoughts 
                           if t.thought_type == ThoughtType.SYNTHESIS]
            if synth_thoughts:
                parts.append(f"[Analysis]: {synth_thoughts[-1].content[:200]}")
        
        if not parts:
            parts.append("[Processing query...]")
        
        return " | ".join(parts)
    
    def learn(self, content: str, tags: List[str] = None):
        """Explicitly teach Prometheus something"""
        return self.memory.store(content, metadata={"tags": tags or []})
    
    def recall(self, query: str, top_k: int = 5) -> List[tuple]:
        """Explicitly search memory"""
        return self.memory.retrieve(query, top_k=top_k)
    
    def get_stats(self) -> Dict:
        """Get complete system stats"""
        memory_stats = self.memory.get_stats()
        swarm_stats = self.swarm.get_stats()
        
        return {
            "queries_processed": self.query_count,
            "memory": memory_stats,
            "swarm": swarm_stats,
            "reasoning_depth": self.reasoner.max_depth
        }
    
    def save_state(self, filepath: str):
        """Save memory state to disk"""
        state = {
            "memory_patterns": {
                pid: {
                    "phase": p.phase_spectrum,
                    "amplitude": p.amplitude_spectrum,
                    "coherence": p.coherence,
                    "metadata": p.metadata
                }
                for pid, p in self.memory.patterns.items()
            },
            "query_count": self.query_count
        }
        
        with open(filepath, 'w') as f:
            json.dump(state, f)
    
    def load_state(self, filepath: str):
        """Load memory state from disk"""
        with open(filepath, 'r') as f:
            state = json.load(f)
        
        # Restore patterns
        for pid, data in state.get("memory_patterns", {}).items():
            from memory.holographic_pure import MemoryPattern
            pattern = MemoryPattern(
                id=pid,
                phase_spectrum=data["phase"],
                amplitude_spectrum=data["amplitude"],
                metadata=data.get("metadata", {}),
                coherence=data.get("coherence", 0.5)
            )
            self.memory.patterns[pid] = pattern
        
        self.query_count = state.get("query_count", 0)


# Interactive mode
def interactive_mode():
    """Run Prometheus in interactive mode"""
    print("🔥 Prometheus - Personal AI Synthesis")
    print("=" * 60)
    print("Type 'quit' to exit, 'stats' for system status")
    print("=" * 60)
    
    prometheus = Prometheus(memory_dimensions=512)
    
    # Pre-load with some knowledge
    prometheus.learn("Python is a programming language created by Guido van Rossum", ["coding", "python"])
    prometheus.learn("The speed of light is 299,792,458 meters per second", ["physics", "science"])
    
    while True:
        print("\n❓ You: ", end="")
        query = input().strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if query.lower() == 'stats':
            stats = prometheus.get_stats()
            print(f"\n📊 Stats:")
            print(f"  Queries: {stats['queries_processed']}")
            print(f"  Memory: {stats['memory']['patterns']} patterns")
            print(f"  Swarm: {stats['swarm']['specialists']} specialists")
            continue
        
        if not query:
            continue
        
        # Process
        result = prometheus.think(query)
        
        print(f"\n🧠 Prometheus [{result['confidence']:.2f} confidence]:")
        print(f"  {result['response']}")
        
        if result['memory_hits'] > 0:
            print(f"\n  💾 Memory hits: {result['memory_hits']}")


if __name__ == "__main__":
    # Run test
    print("🔥 Prometheus Core Test")
    print("=" * 60)
    
    prometheus = Prometheus(memory_dimensions=512)
    
    # Pre-load knowledge
    print("\n📚 Loading knowledge...")
    prometheus.learn("Python uses indentation for code blocks", ["python", "coding"])
    prometheus.learn("Machine learning is AI that learns from data", ["ai", "ml"])
    
    # Test queries
    queries = [
        "What is Python?",
        "Write a Python function",
        "Tell me about AI",
    ]
    
    for query in queries:
        print(f"\n❓ Query: {query}")
        result = prometheus.think(query)
        print(f"🧠 Response: {result['response'][:100]}...")
        print(f"📊 Confidence: {result['confidence']:.2f}")
        print(f"💾 Memory hits: {result['memory_hits']}")
    
    # Show stats
    print("\n📊 Final Stats:")
    stats = prometheus.get_stats()
    print(f"  Total queries: {stats['queries_processed']}")
    print(f"  Memory patterns: {stats['memory']['patterns']}")
    print(f"  Swarm specialists: {stats['swarm']['specialists']}")
    
    print("\n✅ Prometheus Core Test Complete")
    print("\nRun 'python -m prometheus.core' for interactive mode")
