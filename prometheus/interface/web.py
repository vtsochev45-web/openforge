"""
Simple Web Interface for Prometheus

Run: python interface/web.py
Then open: http://localhost:5000
"""

try:
    from flask import Flask, request, jsonify, render_template_string
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("Flask not available. Install with: pip install flask")

import sys
sys.path.insert(0, '/home/tim/.openclaw/workspace/prometheus')

from core import Prometheus

# HTML template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>🔥 Prometheus AI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #0f0f0f;
            color: #e0e0e0;
        }
        h1 { color: #ff6b35; }
        .input-area {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        input[type="text"] {
            flex: 1;
            padding: 12px;
            font-size: 16px;
            background: #1a1a1a;
            border: 1px solid #333;
            color: #e0e0e0;
            border-radius: 4px;
        }
        button {
            padding: 12px 24px;
            font-size: 16px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover { background: #ff8555; }
        .response {
            background: #1a1a1a;
            border: 1px solid #333;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            white-space: pre-wrap;
        }
        .stats {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        .loading { color: #ff6b35; }
    </style>
</head>
<body>
    <h1>🔥 Prometheus - Personal AI Synthesis</h1>
    <p>Holographic Memory × Fractal Reasoning × Swarm Intelligence</p>
    
    <div class="input-area">
        <input type="text" id="query" placeholder="Ask me anything..." 
               onkeypress="if(event.key==='Enter')submitQuery()">
        <button onclick="submitQuery()">Ask</button>
    </div>
    
    <div id="response"></div>
    
    <script>
        async function submitQuery() {
            const query = document.getElementById('query').value;
            if (!query) return;
            
            document.getElementById('response').innerHTML = 
                '<div class="loading">🧠 Thinking...</div>';
            
            try {
                const res = await fetch('/ask', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({query: query})
                });
                
                const data = await res.json();
                
                document.getElementById('response').innerHTML = `
                    <div class="response">
                        <strong>You:</strong> ${query}
                        <br><br>
                        <strong>🧠 Prometheus:</strong> ${data.response}
                        <div class="stats">
                            Confidence: ${(data.confidence * 100).toFixed(1)}% | 
                            Memory hits: ${data.memory_hits} | 
                            Query #${data.query_number}
                        </div>
                    </div>
                `;
            } catch (e) {
                document.getElementById('response').innerHTML = 
                    '<div class="response" style="color: #ff6b35">Error: ' + e + '</div>';
            }
        }
    </script>
</body>
</html>
"""

def create_app():
    if not FLASK_AVAILABLE:
        raise ImportError("Flask required. Install: pip install flask")
    
    app = Flask(__name__)
    prometheus = Prometheus(memory_dimensions=1024)
    
    # Pre-load some knowledge
    prometheus.learn("Python is a programming language", ["coding"])
    prometheus.learn("Machine learning is AI that learns from data", ["ai"])
    
    @app.route('/')
    def index():
        return render_template_string(HTML_TEMPLATE)
    
    @app.route('/ask', methods=['POST'])
    def ask():
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        result = prometheus.think(query)
        return jsonify(result)
    
    @app.route('/stats')
    def stats():
        return jsonify(prometheus.get_stats())
    
    return app

if __name__ == '__main__':
    if not FLASK_AVAILABLE:
        print("❌ Flask not installed")
        print("Install: pip install flask")
        exit(1)
    
    app = create_app()
    print("🔥 Prometheus Web Interface")
    print("=" * 50)
    print("Open: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
