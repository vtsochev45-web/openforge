"""
Swarm Intelligence Network

Multiple specialist AIs that collaborate via gossip protocol.
Democracy of minds - consensus through communication.
"""

from typing import Dict, List, Tuple, Callable, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import random
import hashlib
import json


class SpecialistType(Enum):
    """Types of specialist brains in the swarm"""
    GENERAL = "general"
    CODE = "code"
    MATH = "math"
    CREATIVE = "creative"
    LOGIC = "logic"
    MEMORY = "memory"
    SEARCH = "search"


@dataclass
class Specialist:
    """A single specialist in the swarm"""
    id: str
    specialist_type: SpecialistType
    capability_score: float  # 0-1, how good at its domain
    response_fn: Callable[[str], str]
    vote_weight: float = 1.0
    
    def respond(self, query: str) -> Tuple[str, float]:
        """Generate response with confidence"""
        try:
            response = self.response_fn(query)
            # Confidence based on capability and query match
            confidence = self.capability_score * self._relevance(query)
            return response, confidence
        except Exception as e:
            return f"[Error: {e}]", 0.1
    
    def _relevance(self, query: str) -> float:
        """How relevant is this specialist to the query?"""
        query_lower = query.lower()
        
        relevance_map = {
            SpecialistType.CODE: ["code", "program", "function", "algorithm", "python", "javascript"],
            SpecialistType.MATH: ["math", "calculate", "number", "equation", "solve", "formula"],
            SpecialistType.CREATIVE: ["write", "story", "creative", "design", "art"],
            SpecialistType.LOGIC: ["logic", "reasoning", "prove", "deduction"],
            SpecialistType.MEMORY: ["remember", "recall", "what is", "who is", "when"],
            SpecialistType.SEARCH: ["find", "search", "lookup", "where"],
        }
        
        if self.specialist_type in relevance_map:
            keywords = relevance_map[self.specialist_type]
            matches = sum(1 for kw in keywords if kw in query_lower)
            return min(1.0, 0.3 + matches * 0.2)
        
        return 0.5  # Generalist


@dataclass
class Vote:
    """A vote from a specialist"""
    specialist_id: str
    response: str
    confidence: float
    reasoning: str


class SwarmIntelligence:
    """
    Network of specialists that reach consensus via gossip.
    """
    
    def __init__(self):
        self.specialists: Dict[str, Specialist] = {}
        self.conversation_history: List[Dict] = []
        self.consensus_threshold = 0.6
        
    def register(self, specialist: Specialist):
        """Add a specialist to the swarm"""
        self.specialists[specialist.id] = specialist
        
    def query(self, question: str, max_rounds: int = 3) -> Dict[str, Any]:
        """
        Query the swarm and reach consensus.
        
        Phase 1: All specialists respond independently
        Phase 2: Share responses, revise
        Phase 3: Vote and select winner
        """
        # Phase 1: Initial responses
        initial_votes = self._gather_votes(question)
        
        # Phase 2: Discussion rounds
        current_votes = initial_votes
        for round_num in range(max_rounds):
            current_votes = self._discussion_round(question, current_votes, round_num)
        
        # Phase 3: Final consensus
        winner = self._select_consensus(current_votes)
        
        result = {
            "question": question,
            "consensus": winner,
            "all_votes": [v.__dict__ for v in current_votes],
            "rounds": max_rounds,
            "participants": len(self.specialists)
        }
        
        self.conversation_history.append(result)
        return result
    
    def _gather_votes(self, question: str) -> List[Vote]:
        """Get initial votes from all specialists"""
        votes = []
        
        for spec in self.specialists.values():
            response, confidence = spec.respond(question)
            vote = Vote(
                specialist_id=spec.id,
                response=response,
                confidence=confidence,
                reasoning=f"{spec.specialist_type.value} specialist"
            )
            votes.append(vote)
        
        return votes
    
    def _discussion_round(self, question: str, votes: List[Vote], round_num: int) -> List[Vote]:
        """
        Specialists review others' responses and potentially revise.
        
        Simulates: "I see your point, but what about X?"
        """
        # Find best response so far
        best_vote = max(votes, key=lambda v: v.confidence)
        
        revised_votes = []
        for vote in votes:
            # Specialists may adjust based on others
            # Simple simulation: boost if aligned with best, reduce if divergent
            
            similarity = self._response_similarity(vote.response, best_vote.response)
            
            # Confidence adjustment
            if similarity > 0.7:
                # Agreement - boost confidence
                vote.confidence = min(1.0, vote.confidence * 1.1)
            elif similarity < 0.3:
                # Disagreement - either dig in or concede
                if vote.confidence > best_vote.confidence:
                    # Strong disagreement - maintain with slight reduction
                    vote.confidence *= 0.95
                else:
                    # Weak disagreement - concede
                    vote.confidence *= 0.8
            
            revised_votes.append(vote)
        
        return revised_votes
    
    def _response_similarity(self, a: str, b: str) -> float:
        """Simple similarity between responses"""
        # Word overlap similarity
        words_a = set(a.lower().split())
        words_b = set(b.lower().split())
        
        if not words_a or not words_b:
            return 0.0
        
        intersection = len(words_a & words_b)
        union = len(words_a | words_b)
        
        return intersection / union if union > 0 else 0.0
    
    def _select_consensus(self, votes: List[Vote]) -> Dict:
        """Select winning response based on weighted confidence"""
        if not votes:
            return {"response": "[No response]", "confidence": 0}
        
        # Group by response content
        response_groups: Dict[str, List[Vote]] = {}
        for vote in votes:
            key = vote.response[:100]  # Truncate for grouping
            if key not in response_groups:
                response_groups[key] = []
            response_groups[key].append(vote)
        
        # Score each group by total confidence
        best_group = None
        best_score = 0
        
        for key, group in response_groups.items():
            total_confidence = sum(v.confidence for v in group)
            specialist_weights = sum(
                self.specialists[v.specialist_id].vote_weight 
                for v in group if v.specialist_id in self.specialists
            )
            score = total_confidence * specialist_weights
            
            if score > best_score:
                best_score = score
                best_group = group
        
        if best_group:
            # Return best response from winning group
            winner = max(best_group, key=lambda v: v.confidence)
            return {
                "response": winner.response,
                "confidence": winner.confidence,
                "supporters": len(best_group),
                "total_participants": len(votes)
            }
        
        return {"response": "[No consensus]", "confidence": 0}
    
    def get_stats(self) -> Dict:
        """Get swarm statistics"""
        return {
            "specialists": len(self.specialists),
            "conversations": len(self.conversation_history),
            "by_type": {
                t.value: sum(1 for s in self.specialists.values() if s.specialist_type == t)
                for t in SpecialistType
            }
        }


# Create default swarm
def create_default_swarm() -> SwarmIntelligence:
    """Create a swarm with basic specialists"""
    swarm = SwarmIntelligence()
    
    # Code specialist
    swarm.register(Specialist(
        id="code_1",
        specialist_type=SpecialistType.CODE,
        capability_score=0.9,
        response_fn=lambda q: f"```python\ndef solution():\n    # Code for: {q[:30]}...\n    return 'implemented'\n```",
        vote_weight=1.2
    ))
    
    # Math specialist
    swarm.register(Specialist(
        id="math_1",
        specialist_type=SpecialistType.MATH,
        capability_score=0.85,
        response_fn=lambda q: f"Solution: calculated result for {q[:30]}...",
        vote_weight=1.1
    ))
    
    # General knowledge
    swarm.register(Specialist(
        id="general_1",
        specialist_type=SpecialistType.GENERAL,
        capability_score=0.7,
        response_fn=lambda q: f"General knowledge: {q[:40]}...",
        vote_weight=1.0
    ))
    
    # Logic specialist
    swarm.register(Specialist(
        id="logic_1",
        specialist_type=SpecialistType.LOGIC,
        capability_score=0.8,
        response_fn=lambda q: f"Logical analysis: {q[:40]}...",
        vote_weight=1.0
    ))
    
    # Creative specialist
    swarm.register(Specialist(
        id="creative_1",
        specialist_type=SpecialistType.CREATIVE,
        capability_score=0.75,
        response_fn=lambda q: f"Creative response: {q[:40]}...",
        vote_weight=0.9
    ))
    
    return swarm


# Test
if __name__ == "__main__":
    print("🐝 Swarm Intelligence Network")
    print("=" * 50)
    
    swarm = create_default_swarm()
    
    print(f"\n📊 Swarm initialized: {len(swarm.specialists)} specialists")
    for spec in swarm.specialists.values():
        print(f"  • {spec.id} ({spec.specialist_type.value}): {spec.capability_score:.0%} capable")
    
    # Test queries
    queries = [
        "Write a function to calculate fibonacci",
        "What is 15 times 23?",
        "Explain quantum physics simply",
    ]
    
    for query in queries:
        print(f"\n❓ Query: {query}")
        print("-" * 40)
        
        result = swarm.query(query, max_rounds=2)
        
        consensus = result["consensus"]
        print(f"📢 Consensus: {consensus['response'][:60]}...")
        print(f"   Confidence: {consensus['confidence']:.2f}")
        print(f"   Supporters: {consensus['supporters']}/{consensus['total_participants']}")
        
        print("\n🗳️  All votes:")
        for vote in result["all_votes"]:
            print(f"   {vote['specialist_id']}: {vote['confidence']:.2f} - {vote['response'][:40]}...")
    
    print("\n✅ Swarm Test Complete")
