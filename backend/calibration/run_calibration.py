"""
Calibration runner: tests UJU Cycle against known problems
and computes calibration error (Brier score).
"""
import json
import sys
import requests
import time
from typing import List, Dict

API_BASE = "http://localhost:8000"
CALIBRATION_FILE = "calibration_dataset.json"

def load_dataset(path: str) -> List[Dict]:
    with open(path) as f:
        data = json.load(f)
    return data.get("problems", data) if isinstance(data, dict) else data

def run_single(problem: Dict) -> Dict:
    """Run UJU Cycle on a single calibration problem."""
    # Ingest
    resp = requests.post(f"{API_BASE}/ingest", json={
        "input": problem["query_text"],
        "mode": "depth",
        "user_id": "calibration_bot"
    })
    if resp.status_code != 200:
        return {"error": resp.text, "problem_id": problem["id"]}
    
    session_id = resp.json()["session_id"]
    
    # Poll for completion (max 3 min)
    for _ in range(36):
        time.sleep(5)
        try:
            r = requests.get(f"{API_BASE.replace('8000', '8005')}/explain/{session_id}")
            if r.ok:
                result = r.json()
                break
        except Exception:
            continue
    else:
        return {"error": "timeout", "problem_id": problem["id"]}
    
    # Extract confidence
    compressed = result.get("compressed_signal", {})
    conf_interval = compressed.get("confidence_interval", {})
    predicted_conf = (conf_interval.get("upper", 0.8) + conf_interval.get("lower", 0.5)) / 2
    
    # Simple accuracy: check if expert answer keywords appear in output
    expert_words = set(problem["expert_answer"].lower().split())
    output_text = result.get("explain", {}).get("plain_english", "").lower()
    predicted_words = set(output_text.split())
    overlap = len(expert_words.intersection(predicted_words))
    accuracy = min(1.0, overlap / max(len(expert_words), 1))
    
    ground_truth = problem.get("ground_truth_confidence", 0.5)
    brier = (predicted_conf - ground_truth) ** 2
    
    return {
        "problem_id": problem["id"],
        "domain": problem.get("domain", "unknown"),
        "predicted_confidence": round(predicted_conf, 3),
        "ground_truth_confidence": ground_truth,
        "accuracy": round(accuracy, 3),
        "brier_score": round(brier, 4)
    }

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default=CALIBRATION_FILE)
    parser.add_argument("--output", default="calibration_report.json")
    args = parser.parse_args()
    
    dataset = load_dataset(args.dataset)
    print(f"Running calibration on {len(dataset)} problems...")
    
    results = []
    for i, problem in enumerate(dataset):
        print(f"[{i+1}/{len(dataset)}] {problem['id']}: {problem['query_text'][:60]}...")
        result = run_single(problem)
        results.append(result)
        print(f"  → conf={result.get('predicted_confidence')}, acc={result.get('accuracy')}, brier={result.get('brier_score')}")
        time.sleep(2)
    
    avg_conf = sum(r.get("predicted_confidence", 0) for r in results) / len(results)
    avg_acc = sum(r.get("accuracy", 0) for r in results) / len(results)
    avg_brier = sum(r.get("brier_score", 0) for r in results) / len(results)
    
    report = {
        "total_problems": len(results),
        "avg_predicted_confidence": round(avg_conf, 3),
        "avg_accuracy": round(avg_acc, 3),
        "calibration_error_brier": round(avg_brier, 4),
        "results": results
    }
    
    with open(args.output, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✅ Calibration complete!")
    print(f"   Avg Confidence: {avg_conf:.1%}")
    print(f"   Avg Accuracy:  {avg_acc:.1%}")
    print(f"   Brier Score:   {avg_brier:.4f} (lower = better calibrated)")
    print(f"   Report saved: {args.output}")

if __name__ == "__main__":
    main()
