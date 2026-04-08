# 达能 AI Consumer Runtime Demo Content Playbook

文档版本：v1  
日期：2026-04-02  
状态：演示内容真源  
适用范围：达能前端演示环境的统一内容口径  
配套文档：

- `danone_ai_consumer_frontend_design_2026-04-02.md`
- `danone_ai_consumer_system_design_2026-04-02.md`

## 1. 文档目标

本文档用于统一前端演示环境中的所有业务内容、分数、卡片文案和研究叙事，避免出现以下问题：

- 同一个 study 在不同页面里使用不同的刺激物名称
- Qual 卡片里的主题与 Quant 排序的结论互相矛盾
- Recommendation Summary 的结论和 Compare 页面的数字不一致
- Rerun Suggested 的原因和 Trust Drawer 的状态对不上

原则：

- 所有 P0 组件必须共享同一个研究故事
- 所有数值、主题、摘录、建议动作都以本文件为准
- 设计和开发不得各自改写主研究故事

## 2. 主演示场景

### 2.1 场景定义

- Study Name: `孕期饮品概念筛选 · Beverage TA v2.1 · 2025-Q4`
- Category: `Beverage`
- Study Type: `Concept Screening`
- Demo Goal: 展示 AI Consumer Workbench 如何帮助达能用户研究团队完成一次 `孕期 / 新手妈妈` 场景下的饮品概念筛选

### 2.2 Business Question

推荐统一措辞：

`针对孕期女性与 0-3 岁宝宝妈妈，哪款新品饮品概念最能建立“营养可信赖、日常无负担”的品牌认知，并值得进入下一轮真实消费者验证？`

短版措辞：

`哪款概念最值得进入下一轮真实测试？`

## 3. Target Groups

主演示统一使用两组 target groups：

- `孕期女性 / Tier-1 / 25-35 岁`
  - twin set: `Beverage TA v2.1 / Pregnant Women Subset`
- `0-3 岁宝宝妈妈 / Tier-1&2 / 26-38 岁`
  - twin set: `Beverage TA v2.1 / New Mom Subset`

用于主界面摘要的统一展示：

- `Consumer Twins: Beverage TA v2.1 / Pregnant Women + New Mom`
- `Built from: 5 qual reports, 12 transcripts`
- `Last updated: 2025-12-15`

## 4. Stimuli

主演示只使用 3 个概念，名称固定如下：

- `清泉+`
- `初元优养`
- `安纯`

命名含义：

- `清泉+`
  - 偏清澈、纯净、日常补水、安全感
- `初元优养`
  - 偏营养强化、功能感、优养联想
- `安纯`
  - 偏温和、安全、低刺激，但记忆点较弱

## 5. Quant 基础结果

统一采用标准化 0-100 分：

- `清泉+`: `74`
- `初元优养`: `61`
- `安纯`: `52`

统一 confidence：

- `Confidence: 82 / High`

统一排序：

1. `清泉+`
2. `初元优养`
3. `安纯`

## 6. Recommendation 统一口径

### 6.1 Winner

- `清泉+`

### 6.2 Primary Reason

统一表述：

`清泉+ 在两个核心人群中都建立了更强的“安全感 + 日常饮用适配度”信号。“清”与“泉”的语义让受访 twin 更容易联想到天然、纯净、无负担的饮用体验，同时没有过强的医疗化压迫感。`

### 6.3 Risk Notes

- `初元优养`
  - 在部分孕期女性中唤起了更强的配方粉 / 强营养补充联想，信任并非完全负向，但更像“有门槛的功能产品”
- `安纯`
  - 整体风险不高，但缺乏足够强的记忆点和推进理由，更像安全但不出彩的保守方案

### 6.4 Next Action

统一表述：

`建议推进清泉+ 进入下一轮真实消费者定性深访，并重点验证命名中的“清”与“泉”分别触发的纯净感、安全感和成分可信度边界。`

短版 CTA：

- `Proceed to consumer validation`
- `Explore naming boundary of 清 / 泉`

## 7. Qual Themes

### 7.1 清泉+

主题 1：`功能可信度`

- 成分诉求相对清晰
- 但部分孕妈仍希望看到更具体的营养信息表达

主题 2：`情绪安全感`

- “清”字唤起纯净、轻负担、不会过度刺激的联想
- 与孕期心理诉求高度契合

主题 3：`场景代入`

- 更容易被理解为日常补水替代选择
- 不会被第一眼读成功能型饮品或医疗型产品

### 7.2 初元优养

主题 1：`强化营养感`

- “优养”会让人联想到功能更完整、营养更足

主题 2：`医疗化门槛`

- 一部分孕妈会质疑它是不是“太像配方产品”

主题 3：`信任分化`

- 新手妈妈更容易接受
- 孕期女性对“是否适合自己现在喝”更谨慎

### 7.3 安纯

主题 1：`低风险安全感`

- 名称本身不让人反感

主题 2：`缺乏记忆点`

- 记不住
- 推进理由弱

主题 3：`功能表达不足`

- 相比另外两个概念，无法支撑明确的差异化优势

## 8. Segment Differences

### 8.1 孕期女性

- 最看重：
  - 安全感
  - 成分透明度
  - 不过度刺激的日常适配性
- 对 `清泉+` 的接受度最高
- 对 `初元优养` 的疑虑最大，担心过于功能化 / 医疗化

### 8.2 0-3 岁宝宝妈妈

- 最看重：
  - 兼顾自己与家庭日常饮用
  - 名称是否容易信任
  - 是否像“健康但不复杂”的选择
- 对 `清泉+` 和 `初元优养` 都有正向理解
- 但最终仍认为 `清泉+` 更轻松、更容易纳入日常

## 9. Twin Response Excerpts

这些摘录用于 `Qual Session Card`、`Replay View` 和 `Qual Themes` 支撑内容。

### 9.1 清泉+ 摘录

摘录 1：

`这个名字让我觉得很干净，喝起来不会有负担。`

`但我还是想知道成分细节，比如 DHA 含量到底是多少。`

`我现在会特别在意这些。`

`— Twin [孕期女性 / Tier-1 / 28岁]`

摘录 2：

`“清泉”这个感觉比较自然，不像那种专门强调功能的饮料。`

`如果是我日常补水，我会更愿意先试这个。`

`— Twin [宝宝妈妈 / Tier-2 / 31岁]`

### 9.2 初元优养 摘录

摘录 1：

`“优养”听起来营养很好，但也让我有点像在看婴配粉或者营养补充品。`

`我会想它是不是更适合特定阶段，而不是日常喝。`

`— Twin [孕期女性 / Tier-1 / 30岁]`

### 9.3 安纯 摘录

摘录 1：

`这个名字不让人反感，也挺安全。`

`但我听完不会立刻记住它，也不会特别想去了解更多。`

`— Twin [宝宝妈妈 / Tier-1 / 34岁]`

## 10. 主界面组件映射

### 10.1 Study Setup Bar

#### Study Name

使用：

`孕期饮品概念筛选 · Beverage TA v2.1 · 2025-Q4`

#### Business Question

使用：

`针对孕期女性与 0-3 岁宝宝妈妈，哪款新品饮品概念最能建立“营养可信赖、日常无负担”的品牌认知，并值得进入下一轮真实消费者验证？`

#### Stimulus Scope

使用：

- `清泉+`
- `初元优养`
- `安纯`

补充说明：

`Current scope: concept screening`

`Expandable later to KV / copy / naming / flavor`

#### Study Inputs Snapshot

使用：

- `Consumer Twins: Beverage TA v2.1 / Pregnant Women + New Mom`
- `Built from: 5 qual reports, 12 transcripts`
- `Benchmark Pack: Beverage Concept v4`
- `Last updated: 2025-12-15`

### 10.2 Plan Approval Card

统一展示字段：

- `Study Type: Concept Screening`
- `Target Groups: 2`
- `Stimuli: 3`
- `Qual Mode: AI IDI + Theme Extraction`
- `Quant Mode: SSR Ranking`
- `Estimated Runtime: 28 min`

统一卡片文案：

`I prepared a study plan for 2 target groups and 3 concept stimuli.`

`The run will first complete AI IDIs, extract themes, then ask for review before continuing into SSR-based ranking.`

补充说明：

`Qual sessions run in parallel across twin subsets, which is why the end-to-end runtime remains under 35 minutes.`

### 10.3 Qual Session Card

统一展示字段：

- `Running on: Pregnant Women / New Mom`
- `Completed sessions: 3 / 6`
- `Emerging themes: 功能可信度 / 情绪安全感`

说明：

`6 sessions = 2 target groups × 3 stimuli，每组对每个概念各运行一次 AI IDI。`

统一卡片辅助文案：

`3 sessions completed.`

`Current themes suggest that 清泉+ is leading on emotional safety, while 初元优养 is creating stronger functional but more medicalized associations.`

### 10.4 Mid-run Review Card

统一文案：

`Qual exploration is complete enough to proceed.`

`Main themes are now stable across both target groups.`

`Would you like to continue to SSR quant ranking?`

### 10.5 Recommendation Summary

统一字段：

- `Winner: 清泉+`
- `Confidence: 82 / High`
- `Next Action: Proceed to consumer validation`

统一补充说明：

`清泉+ outperforms on safety perception and daily drinkability across both target groups.`

### 10.6 Quant Ranking

统一展示：

- `清泉+      74   [Confidence: 82 / High]`
- `初元优养   61   [Confidence: 82 / High]`
- `安纯       52   [Confidence: 82 / High]`

### 10.7 Study Complete Card

统一标题：

`Study complete. Recommendation ready.`

统一说明：

`The study has completed qual exploration, quant ranking, and synthesis.`

`The current recommendation is ready for review, export, or archiving.`

统一动作：

- `View Replay`
- `Download Report`
- `Archive to Library`

### 10.8 Rerun Suggestion Card

统一触发原因：

`Twin set updated after new maternal-language transcripts were added.`

`Current result remains usable, but confidence would improve if quant is rerun on the refreshed twin version.`

统一动作：

- `Review changes`
- `Launch rerun`
- `Keep current result`

### 10.9 Rerun Suggested 演示桥接

统一叙事：

`展示完 Completed with Recommendation 后，演示者说明：三周后，团队将 5 份新的孕产用户访谈录音导入了系统。`

`系统检测到 twin set 发生了轻微更新，因此建议基于刷新后的 twin version 重新运行一次 quant ranking，以获得更新的置信度。`

此时切换到 `Rerun Suggested` 状态，并展示 `Rerun Suggestion Card`。

## 11. Replay View 内容口径

### 11.1 Plan

- 输入：
  - business question
  - target groups
  - stimuli
- 输出：
  - approved study plan
- 关键决策：
  - qual first, then quant after review

### 11.2 Qual

- 输入：
  - twin set
  - concept stimuli
- 输出：
  - themes
  - exemplar excerpts
- 关键决策：
  - 清泉+ 和 初元优养进入 quant
  - 安纯保留但优先级下降

### 11.3 Quant

- 输入：
  - reviewed themes
  - anchor set
- 输出：
  - ranking
  - segment differences
- 关键决策：
  - 清泉+ 为首推

### 11.4 Synthesis

- 输出：
  - recommendation
  - next action
  - approval trail

## 12. Insight Compare 页面口径

Compare 页统一讲述：

- `谁赢了`
- `为什么赢`
- `谁的分歧最大`
- `下一步怎么做`

统一顶部结论：

`清泉+ is the recommended concept to move forward.`

统一副标题：

`It combines stronger emotional safety cues with better day-to-day drinkability across both target groups.`

#### 12.1 Stimuli Compare Grid

- `清泉+`
  - `Quant: 74`
  - `Themes: 功能可信度 / 情绪安全感 / 场景代入`
- `初元优养`
  - `Quant: 61`
  - `Themes: 强化营养感 / 医疗化门槛 / 信任分化`
- `安纯`
  - `Quant: 52`
  - `Themes: 低风险安全感 / 缺乏记忆点 / 功能表达不足`

#### 12.2 Quant Ranking 模块

- `清泉+      74   [Confidence: 82 / High]`
- `初元优养   61   [Confidence: 82 / High]`
- `安纯       52   [Confidence: 82 / High]`

#### 12.3 Qual Themes Compare 模块

- `清泉+`
  - strongest on `情绪安全感`
  - strongest on `日常饮用代入`
- `初元优养`
  - strongest on `强化营养感`
  - most divided on `是否过于医疗化`
- `安纯`
  - lowest risk
  - weakest memory and push-forward reason

#### 12.4 Target Group Differences 模块

- `孕期女性`
  - `清泉+` 最强
  - 对 `初元优养` 的疑虑最大
- `新手妈妈`
  - 对 `清泉+` 和 `初元优养` 都有正向理解
  - 但最终仍认为 `清泉+` 更轻松、更容易纳入日常

#### 12.5 Recommended Next Action 模块

- CTA:
  - `Proceed to consumer validation for 清泉+`
- Supporting text:
  - `Validate how “清” and “泉” jointly shape trust, purity, and daily-use fit in real consumer interviews.`

## 13. Trust Drawer 口径

统一展示：

- `Confidence: 82 / High`
- `Benchmark Pack: Beverage Concept v4`
- `Last Calibration: 2026-03-18`
- `Approval Trail: Plan approved -> Mid-run review approved -> Recommendation ready`

## 14. Library 历史记录

统一显示 3 条历史研究：

- `Beverage Concept Screening / 清泉+`
- `IMF Naming Screening / 星护优启`
- `Communication Asset Test / 晨护时刻`

这些记录只承担能力证明，不需要展开完整内容。

## 15. Twins 页面口径

### 15.1 Twin Profile 1

- `Name: Beverage TA v2.1 / Pregnant Women Subset`
- `Built from: 3 qual reports + 7 transcripts`
- `Age range: 25-35 / Tier-1 / 一线城市孕期女性`
- `Research readiness: Concept screening / Naming / KV testing`
- `Version notes: v2.1 added sensitivity to ingredient transparency after 2025-Q3 update`

### 15.2 Twin Profile 2

- `Name: Beverage TA v2.1 / New Mom Subset`
- `Built from: 2 qual reports + 5 transcripts`
- `Age range: 26-38 / Tier-1&2`
- `Research readiness: Concept screening / Communication test`
- `Version notes: v2.1 added daily-use context signals`

## 16. 使用规则

所有参与前端实现和演示内容填充的 AI 员工必须遵守：

- 不得自行改写主研究故事
- 不得把 `清泉+ / 初元优养 / 安纯` 改回 `Concept A/B/C`
- 不得自行修改 quant 分数
- 若需新增卡片内容，必须与本 playbook 的结论、主题和摘录保持一致

## 17. 结论

这份 playbook 的作用只有一个：

`让整个 demo 看起来像同一个系统、同一项研究、同一套结论，而不是多个设计与开发人员各自填写的碎片。`

如果没有它，P0 组件再完整，最后也会因为内容不一致而显得假。
