"""
Script nhanh để test DiagnosticAgent.
Chạy: python scripts/test_agent.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from src.agents.diagnostic_agent import DiagnosticAgent

def main():
    agent = DiagnosticAgent(k=10)
    
    test_cases = [
        "Tôi bị đau đầu dữ dội, mắt mờ, chóng mặt và buồn nôn từ sáng đến giờ.",
        "Gần đây tôi thường xuyên mệt mỏi, hay quên, khó ngủ và cảm thấy buồn không có lý do.",
    ]
    
    for i, symptoms in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"[Test {i}] Triệu chứng: {symptoms}")
        print("="*60)
        
        result = agent.analyze(symptoms)
        
        print(f"\n⚠️  DISCLAIMER: {result.disclaimer}")
        
        if result.emergency_warning:
            print(f"\n🚨 CẢNH BÁO KHẨN CẤP: {result.emergency_warning}")
        
        print(f"\n📋 TOP {len(result.top_diseases)} BỆNH PHÙ HỢP NHẤT:")
        for d in result.top_diseases:
            print(f"  {d.rank}. [{d.match_score:.0%}] {d.disease}")
            print(f"     Chuyên khoa: {d.suggested_specialty}")
            print(f"     Lý do: {d.reasoning[:120]}...")
        
        print(f"\n💡 Lời khuyên: {result.general_advice}")

if __name__ == "__main__":
    main()
