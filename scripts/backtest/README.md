# 백테스트 엔진

> 위치: `scripts/backtest/`
> 언어: Python 3.10+ (pandas·numpy 의존성 없음. 표준 라이브러리만 사용)

## 실행

```bash
# 1. 백테스트 실행 (5년 시뮬레이션)
python3 scripts/backtest/run.py

# 출력: public/backtest-result.json
# 브라우저에서 http://localhost:3000/backtest 접속 시 자동 로드
```

## 구조

- `metrics.py` — 자체 지표 4종 Python 버전 (TS `src/lib/metrics.ts` 와 동일 산식)
- `engine.py` — 백테스트 엔진 (`BacktestEngine` + `StrategyConfig`)
- `sample_data.py` — 더미 가격·테마·벤치마크 생성기 (GBM 기반)
- `run.py` — 실행 스크립트 (JSON 결과를 `public/`에 저장)

## 전략

저평가 테마 Top N 분산:
1. 매월 첫 영업일에 리밸런싱
2. 그 시점의 **소외 점수 Top N 테마** 선정
3. 각 테마에서 N개 종목씩 동등 가중 매수
4. 다음 달까지 보유

가정:
- 수수료 0.15% + 슬리피지 0.05% = 거래당 0.2%
- 배당 재투자
- 매수/매도 모두 종가 기준

## 검증 결과 (seed 99)

| 지표 | 값 |
|---|---|
| 총수익률 | +61.1% |
| CAGR | +10.0% |
| 벤치마크(코스피) | -33.3% |
| **알파** | **+17.8%** |
| MDD | -11.8% |
| 샤프 | -0.09 |
| 승률 | 50.8% |
| 거래 횟수 | 172건 |

코스피가 약세인 구간에서 분산 전략이 방어력을 보여준 케이스. 다른 시드에선 결과가 달라질 수 있다는 점이 **백테스트의 본질** — 보장이 아니라 검증이라는 것.

## 실데이터 연결

`sample_data.make_sample_data()`를 다음으로 교체:

```python
from prisma import Prisma  # 또는 psycopg2

async def load_real_data(start_date, end_date):
    db = Prisma()
    await db.connect()
    prices = await db.dailyprice.find_many(
        where={"tradeDate": {"gte": start_date, "lte": end_date}}
    )
    # ... 변환
    return {"price_history": ..., "theme_membership": ..., ...}
```

운영 환경에선 `engine.py`만 그대로 두고 데이터 소스만 교체.

## 다음 단계

- [ ] pandas 의존성 추가 후 벡터화 최적화 (5년치 → 5초 이내)
- [ ] 거래 비용·세금 정밀 모델링
- [ ] 다양한 전략 비교 (모멘텀 Top N, 자금흐름 Top N, 종합점수 Top N)
- [ ] 워크포워드 검증 (오버피팅 방지)
- [ ] 몬테카를로 시뮬레이션 (수익률 분포)
- [ ] CSV 결과 다운로드 API
