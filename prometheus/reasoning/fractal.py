"""
Fractal Reasoning Engine

Recursive thought process - same structure at all scales.
Depth adapts to complexity automatically.
"""

from typing import List, Dict, Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum
import time


class ThoughtType(Enum):
    """Types of thinking nodes"""
    QUESTION = "question"
    ANALYSIS = "analysis"
    SYNTHESIS = "synthesis"
    ACTION = "action"
    MEMORY = "memory"


@dataclass
class ThoughtNode:
    """A single node in the fractal thought tree"""
    node_id: str
    thought_type: ThoughtType
    content: str
    depth: int
    confidence: float  # 0-1
    sub_thoughts: List['ThoughtNode']
    metadata: Dict[str, Any]
    
    def __init__(self, node_id: str, thought_type: ThoughtType, content: str, 
                 depth: int = 0, confidence: float = 1.0):
        self.node_id = node_id
        self.thought_type = thought_type
        self.content = content
        self.depth = depth
        self.confidence = confidence
        self.sub_thoughts = []
        self.metadata = {}
    
    def add_sub_thought(self, thought: 'ThoughtNode'):
        """Add child thought"""
        thought.depth = self.depth + 1
        self.sub_thoughts.append(thought)
    
    def to_dict(self) -> Dict:
        """Serialize to dict"""
        return {
            "id": self.node_id,
            "type": self.thought_type.value,
            "content": self.content,
            "depth": self.depth,
            "confidence": self.confidence,
            "sub_thoughts": [t.to_dict() for t in self.sub_thoughts],
            "metadata": self.metadata
        }


class FractalReasoner:
    """
    Recursive reasoning engine.
    
    Same algorithm at every level - breaks problems into
    smaller pieces until base case, then synthesizes up.
    """
    
    def __init__(self, 
                 max_depth: int = 5,
                 min_confidence: float = 0.7,
                 specialist_registry: Optional[Dict] = None):
        self.max_depth = max_depth
        self.min_confidence = min_confidence
        self.specialists = specialist_registry or {}
        self.thought_history: List[ThoughtNode] = []
        
    def reason(self, question: str, context: Optional[Dict] = None) -> ThoughtNode:
        """
        Main entry point - fractal recursive reasoning.
        
        Returns root thought node with complete tree.
        """
        root = ThoughtNode(
            node_id="root",
            thought_type=ThoughtType.QUESTION,
            content=question,
            depth=0
        )
        root.metadata = context or {}
        
        # Start recursion
        self._recursive_think(root)
        
        # Store in history
        self.thought_history.append(root)
        
        return root
    
    def _recursive_think(self, node: ThoughtNode) -> float:
        """
        Recursive thinking function.
        
        Breaks problem into sub-problems, solves each,
        combines results. Same logic at every depth.
        
        Returns confidence score.
        """
        # Base case: reached max depth or simple enough
        if node.depth >= self.max_depth or self._is_simple(node.content):
            return self._solve_direct(node)
        
        # Break into sub-problems
        sub_problems = self._decompose(node)
        
        # Recursively solve each sub-problem
        confidences = []
        for sub in sub_problems:
            node.add_sub_thought(sub)
            sub_conf = self._recursive_think(sub)
            confidences.append(sub_conf)
        
        # Synthesize results
        synthesized_conf = self._synthesize(node)
        
        # Combined confidence
        if confidences:
            avg_conf = sum(confidences) / len(confidences)
            node.confidence = synthesized_conf * avg_conf
        else:
            node.confidence = synthesized_conf
        
        return node.confidence
    
    def _is_simple(self, content: str) -> bool:
        """Determine if problem is simple enough for direct solution"""
        # Heuristics:
        # - Short length
        # - Single question
        # - Known pattern
        
        if len(content) < 50:
            return True
        
        if content.count('?') == 1 and len(content) < 100:
            return True
        
        # Check if we have specialist for this
        for pattern, _ in self.specialists.items():
            if pattern in content.lower():
                return True
        
        return False
    
    def _decompose(self, node: ThoughtNode) -> List[ThoughtNode]:
        """
        Break problem into sub-problems.
        
        Strategy depends on problem type.
        """
        content = node.content
        sub_problems = []
        
        # Pattern matching for decomposition
        if "write" in content.lower() and "code" in content.lower():
            # Code writing: break into steps
            sub_problems = [
                ThoughtNode(f"{node.node_id}_1", ThoughtType.ANALYSIS, 
                           "Analyze requirements and inputs/outputs", node.depth + 1),
                ThoughtNode(f"{node.node_id}_2", ThoughtType.ANALYSIS,
                           "Design algorithm structure", node.depth + 1),
                ThoughtNode(f"{node.node_id}_3", ThoughtType.ACTION,
                           "Write the implementation", node.depth + 1),
                ThoughtNode(f"{node.node_id}_4", ThoughtType.ANALYSIS,
                           "Review and optimize", node.depth + 1),
            ]
        
        elif "explain" in content.lower() or "what is" in content.lower():
            # Explanation: break into aspects
            sub_problems = [
                ThoughtNode(f"{node.node_id}_1", ThoughtType.MEMORY,
                           "Retrieve definition and core concept", node.depth + 1),
                ThoughtNode(f"{node.node_id}_2", ThoughtType.ANALYSIS,
                           "Find examples and analogies", node.depth + 1),
                ThoughtNode(f"{node.node_id}_3", ThoughtType.SYNTHESIS,
                           "Structure the explanation", node.depth + 1),
            ]
        
        elif "compare" in content.lower() or "difference" in content.lower():
            # Comparison
            sub_problems = [
                ThoughtNode(f"{node.node_id}_1", ThoughtType.ANALYSIS,
                           "Analyze first option", node.depth + 1),
                ThoughtNode(f"{node.node_id}_2", ThoughtType.ANALYSIS,
                           "Analyze second option", node.depth + 1),
                ThoughtNode(f"{node.node_id}_3", ThoughtType.ANALYSIS,
                           "Find similarities", node.depth + 1),
                ThoughtNode(f"{node.node_id}_4", ThoughtType.ANALYSIS,
                           "Find differences", node.depth + 1),
                ThoughtNode(f"{node.node_id}_5", ThoughtType.SYNTHESIS,
                           "Summarize comparison", node.depth + 1),
            ]
        
        else:
            # Generic: break into analyze → solve → verify
            sub_problems = [
                ThoughtNode(f"{node.node_id}_1", ThoughtType.ANALYSIS,
                           "Understand the problem", node.depth + 1),
                ThoughtNode(f"{node.node_id}_2", ThoughtType.ACTION,
                           "Develop solution approach", node.depth + 1),
                ThoughtNode(f"{node.node_id}_3", ThoughtType.SYNTHESIS,
                           "Formulate answer", node.depth + 1),
            ]
        
        return sub_problems
    
    def _solve_direct(self, node: ThoughtNode) -> float:
        """
        Direct solution for simple problems.
        
        Uses specialists if available, otherwise returns
        base confidence.
        """
        content = node.content.lower()
        
        # Check specialists
        for pattern, specialist in self.specialists.items():
            if pattern in content:
                try:
                    result = specialist(node.content)
                    node.content = result
                    node.thought_type = ThoughtType.SYNTHESIS
                    return 0.95
                except:
                    pass
        
        # No specialist - base confidence based on simplicity
        simplicity_score = max(0, 1 - len(node.content) / 500)
        node.thought_type = ThoughtType.ACTION
        return 0.5 + simplicity_score * 0.3
    
    def _synthesize(self, node: ThoughtNode) -> float:
        """
        Combine sub-thoughts into coherent result.
        
        Returns confidence in synthesis.
        """
        if not node.sub_thoughts:
            return node.confidence
        
        # Count successful sub-thoughts
        successful = sum(1 for t in node.sub_thoughts if t.confidence > self.min_confidence)
        total = len(node.sub_thoughts)
        
        # Confidence based on sub-thought success rate
        synthesis_conf = successful / total if total > 0 else 0.5
        
        # Create synthesized content
        parts = [t.content for t in node.sub_thoughts]
        node.content = " | ".join(parts)
        
        node.thought_type = ThoughtType.SYNTHESIS
        return synthesis_conf
    
    def get_thought_path(self, root: ThoughtNode) -> List[str]:
        """Get the path of reasoning from root to leaves"""
        path = [f"[{root.thought_type.value}] {root.content[:50]}..."]
        
        # Follow highest confidence path
        if root.sub_thoughts:
            best = max(root.sub_thoughts, key=lambda t: t.confidence)
            path.extend(self.get_thought_path(best))
        
        return path
    
    def format_tree(self, node: ThoughtNode, indent: int = 0) -> str:
        """Format thought tree as string"""
        prefix = "  " * indent + ("└─ " if indent > 0 else "")
        conf_str = f"[{node.confidence:.2f}]"
        type_str = node.thought_type.value[:4].upper()
        
        result = f"{prefix}[{type_str}]{conf_str} {node.content[:60]}"
        
        for child in node.sub_thoughts:
            result += "\n" + self.format_tree(child, indent + 1)
        
        return result


# Test
if __name__ == "__main__":
    print("🌳 Fractal Reasoning Engine")
    print("=" * 50)
    
    # Create reasoner
    reasoner = FractalReasoner(
        max_depth=3,
        min_confidence=0.6,
        specialist_registry={
            "math": lambda x: "MATH_RESULT: calculated",
            "code": lambda x: "CODE_RESULT: function generated"
        }
    )
    
    # Test questions
    questions = [
        "Write a Python function to sort a list",
        "What is machine learning?",
        "Compare Python and JavaScript"
    ]
    
    for q in questions:
        print(f"\n❓ Question: {q}")
        print("-" * 40)
        
        result = reasoner.reason(q)
        
        print("🧠 Reasoning Tree:")
        print(reasoner.format_tree(result))
        
        print(f"\n📊 Final Confidence: {result.confidence:.2f}")
        print(f"🌿 Tree Depth: {max(t.depth for t in result.sub_thoughts) if result.sub_thoughts else 0}")
    
    print("\n✅ Fractal Reasoning Test Complete")
