(() => {
  const body = document.getElementById("terminalBody");
  const form = document.getElementById("promptForm");
  const input = document.getElementById("cmd");
  const promptPath = document.getElementById("promptPath");

  if (!body || !form || !input) return;

  const state = {
    history: [],
    historyIdx: -1,
    section: "base",
    lang: "zh",
    currentWritingId: null,
    writingsCursor: 0,
    writingsIndexEls: [],
  };
  const scrollToBottom = () => {
    body.scrollTop = body.scrollHeight;
  };

  const printLine = (text, cls) => {
    const div = document.createElement("div");
    div.className = `line${cls ? ` ${cls}` : ""}`;
    div.textContent = text === "" ? "\u00A0" : text;
    body.appendChild(div);
    scrollToBottom();
    return div;
  };

  const WRITINGS_HINT_TYPE_MS = 12;

  const appendEmptyLine = (cls) => {
    const div = document.createElement("div");
    div.className = `line${cls ? ` ${cls}` : ""}`;
    div.textContent = "";
    body.appendChild(div);
    scrollToBottom();
    return div;
  };

  const measureLineHeightForText = (text, cls) => {
    const full = text === "" ? "\u00A0" : String(text);
    const w = Math.max(1, body.clientWidth || body.offsetWidth || 0);
    const probe = document.createElement("div");
    probe.className = `line${cls ? ` ${cls}` : ""}`;
    probe.textContent = full;
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;width:${w}px;`;
    body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    body.removeChild(probe);
    return Math.max(0, Math.ceil(h));
  };

  const typewriterFillLineEl = (div, text, perCharMs = WRITINGS_HINT_TYPE_MS) => {
    const full = text === "" ? "\u00A0" : String(text);
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      div.textContent = full;
      scrollToBottom();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let i = 0;
      const step = () => {
        if (i >= full.length) {
          resolve();
          return;
        }
        i += 1;
        div.textContent = full.slice(0, i);
        scrollToBottom();
        setTimeout(step, perCharMs);
      };
      step();
    });
  };

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const parseInlineMd = (raw) => {
    let html = escapeHtml(raw);
    // ***bold+italic***
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<span class="md-bold md-italic">$1</span>');
    // **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">$1</span>');
    // *italic*
    html = html.replace(/\*([^*]+)\*/g, '<span class="md-italic">$1</span>');
    // <<highlight>>
    html = html.replace(/&lt;&lt;([\s\S]*?)&gt;&gt;/g, '<span class="md-highlight">$1</span>');
    // auto-link plain URLs
    html = html.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a class="md-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return html;
  };

  const printMdLine = (text, cls) => {
    const div = document.createElement("div");
    div.className = `line${cls ? ` ${cls}` : ""}`;
    if (text === "") {
      div.textContent = "\u00A0";
    } else {
      div.innerHTML = parseInlineMd(text);
    }
    body.appendChild(div);
    scrollToBottom();
    return div;
  };

  const printPromptEcho = (cmd) => {
    printLine(`${state.section}$ ${cmd}`, "muted");
  };

  const normalize = (s) => s.trim().replace(/\s+/g, " ");

  const content = {
    intro: [
      "INTRO_",
      "",
      "Welcome to Dongyun Lu's personal page.",
      "",
      "Type 'cv' to see the CV.",
      "Type 'writings' to check out random thoughts and observations.",
      "Type 'publications' to see works in academia.",
     
    
    ],
    cv: [
      "CV_",
      "",
      "- name: DONGYUN LU/陸東韻/リク トウイン",
      "- email: ludongyun3@gmail.com",
      "- language: 中文, English, 日本語",
      "- major focus: Biology/Medicine Science/Immunology/Human Immunology",
      "- hobbies:",
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Painting (Acrylic, Collage，illustration)",
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Reading (Literatures, and those Books on Sociology, Ethics and Epistemology)",
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Swimming (Literally thinking about nothing when swimming)",
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Video Gaming (Nintendo series, especially Pokemon)",
      "\u00A0",
      "2015-2018 : Shanghai Shixi High School.",
      "2018-2022 : Bs., Shanghai Jiao Tong University, Biotechnology(major)/Philosophy(Minor).",
      "2023-2024 : Research student, Kyoto University, Immunology.",
      "2024-2026 : Master's Program, Kyoto University, Immunology.",
      "2026-now : Doctoral's Program, Kyoto University, Immunology.",
      
    ],
    writing: [
      "WRITING_",
      "",
      "- 2026-03-13  first entry (placeholder)",
      "- 2026-03-14  second entry (placeholder)",
      "",
      "Edit content.writing in app.js to reflect your posts / diary.",
    ],
    publications: [
      "PUBLICATIONS_",
      "",
      "**Research Presentation**",
      "[1] Lu, D., Shinwari, N., Xue, X., Chua, C., Hashiguchi, T., & Ueno, H. (2024, Jan 31 - Feb 3). Induction of high-affinity TFH cells after 1st shot predicts vaccine-induced antibody response [Poster presentation, peer-reviewed]. <<The 2nd Symposium of AMED SCARDA Japan Initiative for World-leading Vaccine Research and Development Centers, Kyoto, Japan.>>",
      "",
      "[2] Lu, D., Chua, C., Shinwari, N., Xue, X., Hashiguchi, T., Ito, I., Kotaki, R., Takahashi, Y., & Ueno, H. (2024, Aug 27 - 28). Identifying intercorrelation among the pre-existing immunity against emerging variants of SARS-CoV-2 [Oral presentation, peer-reviewed]. <<The 3rd Joint Symposium of AMED-SCARDA Supportive Institute, Hamamatsu, Japan.>>",
      "",
      "[3] Lu, D., Chua, C., Shinwari, N., Xue, X., Hashiguchi, T., Ito, I., Kotaki, R., Takahashi, Y., & Ueno, H. (2024, Dec 2 - 6). Antigen-specific high avidity CD4⁺ T cells correlate with pre-existing antigen-specific proliferating B cells and neutralizing antibody titers [Oral + Poster presentation, peer reviewed]. <<The 53rd Japanese Society of Immunology Annual Conference, Nagasaki, Japan.>>",
      "",
      "[4] Lu, D., Chua, C., Shinwari, N., Xue, X., Hashiguchi, T., Ito, I., Kotaki, R., Takahashi, Y., & Ueno, H. (2025, Feb 7 - 8). Antigen-specific high avidity CD4⁺ T cells correlate with pre-existing antigen-specific proliferating B cells and neutralizing antibody titers [Poster presentation, peer reviewed]. <<The 22nd Takeda Science Foundation Symposium on Bioscience.>>",
      "",
      "[5] Lu, D., Chua, C., Shinwari, N., Xue, X., Hashiguchi, T., Ito, I., Kotaki, R., Takahashi, Y., & Ueno, H. (2025, Feb 12 - 14). Antigen-specific high avidity CD4⁺ T cells correlate with pre-existing antigen-specific proliferating B cells and neutralizing antibody titers [Oral presentation, peer-reviewed]. <<The 1st Kyoto Immunology Symposium, Kyoto, Japan.>>",
      "",
      "[6] Lu, D., Chua, C., Shinwari, N., Xue, X., Hashiguchi, T., Ito, I., Kotaki, R., Takahashi, Y., & Ueno, H. (2025, Mar 17 - 19). Antigen-specific high avidity CD4⁺ T cells correlate with pre-existing antigen-specific proliferating B cells and neutralizing antibody titers [Oral presentation, peer-reviewed]. <<The 2nd Symposium of AMED SCARDA Japan Initiative for World-leading Vaccine Research and Development Centers, Kobe, Japan.>>",
      "",
      "",
      "**Publications**",
      "[1] 陸東韻、上野英樹. 感染症、ワクチン接種で誘導される濾胞性ヘルパーT 細胞応答. 炎症と免疫 vol32 no.6 2024 (Review article; not peer-reviewed)",
      "",
      "[2] Masuo, Y., Lu, D., Matsuyama, J. et al. Human immunology soars in Japan. Nat Immunol 26, 653-656 (2025). (Commentary; invited article, not peer-reviewed)",
      "",
      "",
      "**Awards**",
      "[1] Best Oral Presentation Award for Early Career Researcher in the 3rd Joint Symposium of Support Organizations.",
      "",
      "[2] Best Presentation Award in the 53rd Annual Meeting of Japanese Society of Immunology.",
      "https://www2.aeplan.co.jp/jsi2024/en/best-presentation-award2024.html (WS08)",
      "",
      "[3] Best Oral Presentation Award for Early Career Researcher in the 2nd Joint Symposium of AMED SCARDA Japan Initiative for World-leading Vaccine Research and Development Center.",
      "https://www.utopia.u-tokyo.ac.jp/joint_symposium2025",
      "",
    ],
    links: [
      "LINKS_",
      "",
      "- github: https://github.com/yourname",
      "- x: https://x.com/yourname",
      "- email: mailto:your@email.com",
    ],
  };

  // 手动维护的 writings 条目（作为回退）
  // 现在支持从 writings/index.json + *.md 动态加载。
  // 若文件加载失败，会自动回退到这里的内置内容。
  let writingsEntries = [
    {
      id: "philo-last-class",
      title: "关于本科最后的哲学课",
      linesByLang: {
        zh: [
          "关于本科最后的哲学课",
          "",
          "我的辅修-哲学于2021年末结课了。这段话写于20220509，我正站在终结与新始的边界之时。",
          "",
          "学习哲学的这段经历对我而言是无比珍贵且终身受用的，毋庸置疑，毋庸置疑。",
          "它现在躺在我的回忆里，伴随着夜晚昏黄的灯光（因为所有哲学课都在晚上），散发出暧昧又令人安心的味道。",
          "即便愚钝如我，我也能毫不犹豫地喊出：我喜欢哲学。",
          "那颗无知的、天真的心，曾有一时可以无忧无虑、贪婪而任性地思考所有我好奇的、根本的、关乎这个世界的问题。",
          "这是多么奢侈，多么令人羡慕的事情。",
          "",
          "随后的日子里越发觉察到，要保持这样一颗天真纯粹的心是何等不易。",
          "但是作为一个接受过哲学教育的人，逡巡于表象又自怨自艾是可耻的。",
          "应当时刻要求自己的思维有所超越；",
          "应当对这世间的真实样貌有所觉悟，并推进这份理解的边界。",
          "",
          "纯粹之物并非 dasein 的所属物。",
          "也许它于我而言或不存在，或只是暂时的。",
          "也许留给所有哲学家的一个共同的课题是：背负 dasein 那龌龊、肮脏、不堪入目的一面，",
          "不断尝试去抓住转瞬即逝的纯粹。",
          "",
          "我往往发现过去的自己更加具有智慧，",
          "因而我也斗胆说，这或许不是一个自大的发言。",
        ],
        eng: [
          "Regarding my final philosophy course in my undergraduate minor—Philosophy—it concluded at the end of 2021.",
          "This was written on May 9th, 2022, as I stood at the boundary between an ending and a new beginning.",
          "",
          "My experience studying philosophy has been immensely precious and invaluable for life.",
          "Undoubtedly, it now rests in my memories, accompanied by the warm, dim light of the evening—because all philosophy classes were held at night—radiating a subtle yet comforting atmosphere.",
          "Even someone as dull as I am could shout without hesitation: I love philosophy.",
          "That ignorant, innocent heart once allowed me to think freely, without worry, greedily and recklessly, about all the questions I was curious about—fundamental questions concerning the world itself.",
          "What a luxury, what an enviable state that was.",
          "",
          "In the days that followed, I increasingly realized how difficult it is to maintain such a pure, innocent heart.",
          "But as someone educated in philosophy, it is shameful to linger in appearances or indulge in self-reproach.",
          "One should constantly demand that one's thinking surpass itself, remain aware of the true nature of the world, and push the boundaries of understanding.",
          "",
          "The pure in itself does not belong to Dasein.",
          "Perhaps for me it does not exist, or perhaps only temporarily.",
          "Perhaps what is left for all philosophers is a shared task: to bear the ugly, dirty, and intolerable aspects of Dasein, and to continually attempt to grasp fleeting moments of purity.",
          "",
          "I often find that my past self possessed more wisdom.",
          "Therefore, I dare to say—without it being a statement of arrogance—that this reflection is not hubris.",
        ],
        jap: [
          "私の学部での最後の哲学の授業、つまり副専攻としての哲学は、2021年末に終了しました。",
          "これは2022年5月9日に書いたもので、私は終わりと新たな始まりの境界に立っていました。",
          "",
          "哲学を学んだ経験は、私にとって非常に貴重で、生涯にわたって役立つものです。",
          "疑いなく、それは今私の記憶の中にあり、夜の薄暗い光とともに（すべての哲学の授業は夜に行われました）、微かでありながら安心感を与える雰囲気を漂わせています。",
          "愚かな私でさえ、ためらわずに叫ぶことができます：私は哲学が好きだ、と。",
          "その無知で、純真な心は、一時期、心配なく、貪欲に、無邪気に、自分が好奇心を持つすべての根本的で世界に関わる問いについて考えることを可能にしてくれました。",
          "なんと贅沢で、羨ましいことでしょうか。",
          "",
          "その後の日々の中で、私はますます、そうした純粋で無垢な心を保つことがいかに困難であるかを実感しました。",
          "しかし、哲学教育を受けた者として、表面的なものにとどまり自己憐憫に耽ることは恥ずべきことです。",
          "常に思考を超越させ、この世の真の姿を自覚し、その理解の境界を押し広げることが求められます。",
          "",
          "純粋なものは、Daseinの所属物ではありません。",
          "おそらく私にとってそれは存在しないか、あるいは一時的なものに過ぎないのでしょう。",
          "哲学者すべてに共通する課題として残されているのは、おそらく、Daseinの醜く、汚れ、耐えがたい側面を背負い、瞬間的な純粋さをつかもうと絶えず試みることなのでしょう。",
          "",
          "過去の自分の方がより賢明であったことに、私はしばしば気づきます。",
          "したがって、傲慢な発言ではないことを承知のうえで、こう言わせてもらいます。",
        ],
      },
    },
    {
      id: "stardust-to-stardust",
      title: "STARDUST to STARDUST：Reflecting on Living and Dying",
      linesByLang: {
        zh: [
          "看完了***STARDUST to STARDUST：Reflecting on Living and Dying***。",
          "这本书的作者是 Erik Olin Wright，一位社会学家、大学教授，以及左翼马克思主义者。于2019年去世，死于急性白血病(AML)。",
          "而这本书是他在确诊后到死亡前2天(约10个月)每天记录的博客的合集(condensation)。内容包含了他对自己医疗状况的记录以及对生命的反思。",
          "",
          "在本书的最后一页写着:",
          "<aside>",
          "…And I'm okay. I'm okay.",
          "***",
          "Erik died at 12:12 a.m on January 23.",
          "</aside>",
          "",
          "如果在开始阅读前先翻看这一页，即便你事先 ***知道*** 他没能挺过这场疾病，这也会完全改变你的阅读体验。",
          "我就是这么做的。这意味着你阅读的是：一个真实的人最后几个月中实时的、每一个当下。***意识*** 到这一点很重要。",
          "",
          "### 真诚的知识分子/特权阶级",
          "作为一个基础医学研究生，我惊讶于他对癌症治疗理解的清晰程度。",
          "从他的 medical update 中可以感受到他对这些免疫治疗的理解程度并不亚于一个非该领域的生物学研究生（我）。",
          "从症状到数值解读，以及治疗的原理，他的文字完全可以作一篇质量不俗的科普文章。这些想必是他从与医生的沟通中学到的。",
          "无需多言，他确实是一个真正的知识分子。知识分子总是以一种尝试理解的姿态来面对这个世界的，包括自己的处境。",
          "",
          "他也***理解***（并不是那种肤浅的“知道”）自己作为 ***特权阶级(privilege)*** 的身份。",
          "他赞叹自己所在的医院展开的工作（每个护士只同时处理3个病人？！），也感谢自己被爱自己的人以及自己爱的人所包围，从而让自己得以相对平静。",
          "但同时他知道这来自一种特权。来自他的身份、社会阶级、资源（毕竟他在开篇的时候就写到: I activated my doctorly *networks* as soon as I had the news…）。",
          "对此，他在 ***page59, Suffering, but with privilege*** 这一篇中做了阐述。",
          "<aside>",
          "…This is sheltered suffering——suffering muted by privilege.",
          "It is the kind of setting in which everyone should be able to live their lives in moment like this.",
          "But, of course, it is available to very few people in the world…",
          "</aside>",
          "",
          "一段非常有意思的陈述是：",
          "<aside>",
          "I don't feel *guilty* for being in privileged position to survive this illness with muted suffering.",
          "Nothing whatsoever about the injustice of the world would be improved if I unilaterally rejected this privilege…",
          "</aside>",
          "",
          "一个重要的话题：**那些身在特权中的人要如何面对自己的特权身份。**",
          "在今天，有机会接受高等教育的人不可避免地处于特权阶层。",
          "这种特权不仅来源于个人努力，更受家庭资源、地区教育资源分配等外在因素的影响。",
          "对于我来说，这种特权是无法否认的。**那么，如何成为一个真诚的（至少不令人讨厌的）特权阶级？**",
          "",
          "Eric 的回答是，单纯的负罪感并不能改变任何不公，真正重要的是为此采取行动。",
          "我很认同他的观点，但并不觉得每个人都需要成为一个左翼马克思主义者来解决这个问题。",
          "我有两点很简单的想法。",
          "",
          "首先，需要**意识**到并**承认（向自己承认）**自己所处在的特权——这是最基本的。",
          "人会出于保护自己的特权或出于一些罪恶感（我同意 Eric 说的，处在特权地位并不是一件罪恶的事），而有意或无意地 **遗忘** 自己的特权身份。",
          "**可这种无知终究是令人讨厌的。**",
          "",
          "其次，拥有特权意味着你可以更轻易地做到“一些事情”，但我们需要慎重判断这些事情是否值得去做。",
          "比如保全自己的生命(Eric)、知名左翼哲学家卖课（齐泽克）、或者写程序自动抢门票。",
          "（我并不是在这里在含沙射影任何事情，这是一个中性的疑问。事实上我并没有想清楚。）",
          "虽然没有人能够想明白所有事情，但是分离特权本身和实施特权是完全有必要的。",
          "",
          "归根结底，特权不是原罪，但对特权的无视或滥用则是责任的缺失。",
          "",
          "### Be Goofy",
          "整本书都透露着 Eric 这个人的幽默。",
          "很少有人会把移植骨髓细胞形容成新居民入住房屋，把癌症的症状和非洲观光 Big Five 做类比还声称自己已经集齐了所有症状，",
          "把化疗时的 lead-lined room 隔离想象成宇航员的落地程序。",
          "有的时候我感到他带有研究者常有的那种，有理想主义色彩的“傻”。",
          "",
          "就像是回应读者，Eric 在这本书的末尾处（也是他生命的末尾）讨论了“Goofiness(愚笨)”的价值。",
          "在 ***page 255, Excerpt of the letter to my grandchildren*** 这一篇中写道：",
          "<aside>",
          "Goofiness as part of a way of life was really important to me…A closely related term is silly.",
          "It means having, as part of your way of life, something to counter the dead seriousness of our human condition,",
          "to make life fun and funny and not to take everything so seriously.",
          "</aside>",
          "",
          "接着，是一段我认为非常重要的讨论：",
          "<aside>",
          "I do take the world very seriously…That's taking the way of life as something important, and you have to devote attention to it.",
          "But there's so much that's hard in the world and difficult…",
          "So goofiness for me has always been a way of lightening things up.",
          "It doesn't mean “don't be so serious”. It means, “in addition to being serious, have a lighthearted view of life as well as a serious one.”",
          "</aside>",
          "",
          "be goofy 并不是提倡一种 don't be so serious 的态度，而是让人们在 serious 地对待**生命**的同时以一种轻松的视角去对待**生活**。",
          "be goofy 也不是什么特别容易的事，我想这可以算是一种修为。",
          "责骂世界是一坨狗屎是很容易的。我是说：对世界抱有消极态度是容易的。",
          "**你只是和这个世界一起陷入了熵增之中。这是自然而然会发生的，并不需要额外的努力(effort)。**",
          "对世界有清晰认知的同时保持一种幽默而轻松的状态本身是美的——我想以这种姿态存在于世界上。",
          "借 Eric 之言：I feel that I live a more joyful life because I live this way.",
          "",
          "### If love is false, there is nothing.",
          "Eric 诙谐的文字会让人忘记他是一个每天都在忍受痛苦的急性白血病患者。",
          "但肉体以及精神上的巨大痛苦仍是这场抗争的底色。",
          "虽然 Eric 本人的厚度一定程度上掩盖了现实的尖锐感，但在生命力的脆弱处那可怖的底色便又浮出水面。",
          "",
          "Eric 很诚实地记录了自己崩溃的时刻。",
          "在 ***page 217, A very disturbing, bleak moment*** 这一篇中，Eric 少见地描写了一次令他绝望的体验。",
          "<aside>",
          "…I was sleeping yesterday afternoon and had an extremely brief dream snippet,…",
          "…It was a malevolent scene, not a story: I opened a door to a room that was filled with everyone I love and who loves me—",
          "all my immediate family, grandchildren, extended family, friends, students, colleagues. Everyone.",
          "And they were all laughing at me, mocking my efforts to understand my illness in my blog, saying I was ridiculous…",
          "I let out a scream and woke up sobbing, gasping.",
          "…This, I feel, was the worst nightmare possible: the very foundation of my life, love, became empty.",
          "I have firmer beliefs in the love experience in the world than in my critique of capitalism.",
          "If love is false, there is nothing.",
          "</aside>",
          "",
          "Eric 非常敏锐地察觉到了这种绝望的本质：这个场景击穿了他信念以及生活的基础——来自周围人的爱。",
          "爱，或者我喜欢说***与他者的深层连接***，**非常重要**。",
          "",
          "说起来，詹青云在奇葩说上那句“到底是什么样的远大前程，值得错过每个四季。”也给我同样的感受。",
          "虽然这句话本身——因为出自综艺节目——有点造作。",
          "但是我认为它也触及了一些更为核心的、关于 WHAT is important 的思考。",
          "关于这句话的衍生讨论大多是“爱情-事业二选一”。可是为什么一定要讨论这两者的关系呢？",
          "这会让我的思考无聊很多，狭隘很多。",
          "",
          "Alas。语言，语言就像是一种降维(dimensional reduction)。",
          "如果事情的本质是一个 X 维的向量，我们能感受到的就已经是被降维过的(dimension <= X-1)，",
          "而语言——这个粗陋的筛子——把所有的复杂性压缩到二维的平面。",
          "当我们急着将眼前的真实(reality)用语言凝固成“爱情”、“事业”这些无趣的概念的时候，我们便已经落入迷宫了。",
          "",
          "…",
          "我的思路有点乱了。这种讨论并不适合在一个读书笔记里展开。",
          "我只是想说，在那些语言无法言说的部分，比如 Eric 孤独的梦里，可能流淌着无比真实的存在，",
          "流淌着与他者的深层连接，或者说，爱。",
          "",
          "### 存在的消失",
          "摘录一下这本书最令人触动的文字。",
          "<aside>",
          "Human life is a wild, extraordinary phenomenon: elements are brewed in the center of stars and exploding supernova,",
          "spewed across the universe; they eventually clumped into a minor planet around a modest star;",
          "then after some billions of years this “stardust” became complex molecules with self-replicating capacities that we call life…",
          "That I, as a conscious being will cease to exist pales in significance to the fact that I exist at all.",
          "I don't find that this robs my existence of meaning; it's what makes infusing life with meaning possible.",
          "</aside>",
        ],
        eng: [
          "I finished reading ***STARDUST to STARDUST: Reflecting on Living and Dying***.",
          "The author of this book is Erik Olin Wright, a sociologist, university professor, and leftist Marxist.",
          "He passed away in 2019 from acute myeloid leukemia (AML).",
          "This book is a collection (condensation) of the blog posts he wrote every day from the time he was diagnosed until two days before his death (about 10 months).",
          "It includes his records of his medical condition as well as reflections on life.",
          "",
          "On the very last page of the book, it reads:",
          "<aside>",
          "…And I'm okay. I'm okay.",
          "***",
          "*Erik died at 12:12 a.m on January 23.*",
          "</aside>",
          "",
          "If you flip to this page before starting to read—even if you already ***know*** he did not survive the illness—it will completely change your reading experience.",
          "",
          "That's what I did. It means that what you are reading is: a real person, moment by moment, during the final months of his life.",
          "It is ***crucial*** to be aware of this.",
          "",
          "### **A sincere intellectual / privileged class**",
          "As a graduate student in basic medical research, I was struck by his clear understanding of cancer treatment.",
          "From his medical updates, it is evident that his grasp of immunotherapies was comparable to that of a biology graduate student outside the field (like myself).",
          "From interpreting symptoms to analyzing lab values and explaining the principles behind treatments, his writing could easily serve as a high-quality science communication article.",
          "Clearly, this knowledge came from his interactions with doctors.",
          "There is no question: he was a true intellectual.",
          "Intellectuals always face the world, including their own circumstances, with a stance of trying to understand.",
          "",
          "He also ***understood*** (not superficially “knew”) his status as a ***privileged person***.",
          "",
          "He admired the work done by his hospital (each nurse only caring for three patients at a time?!), and he was grateful to be surrounded by people who loved him and whom he loved, which allowed him relative peace.",
          "Yet he recognized that this came from privilege: from his identity, social class, and resources (after all, he wrote at the beginning: *I activated my doctorly networks as soon as I had the news…*).",
          "He elaborates on this in ***page 59, “Suffering, but with privilege.”***",
          "",
          "<aside>",
          "…This is sheltered suffering——suffering muted by privilege.",
          "It is the kind of setting in which everyone should be able to live their lives in moment like this.",
          "But, of course, it is available to very few people in the world…",
          "</aside>",
          "",
          "A particularly interesting statement reads:",
          "",
          "<aside>",
          "…",
          "I don't feel *guilty* for being in privileged position to survive this illness with muted suffering.",
          "Nothing whatsoever about the injustice of the world would be improved if I unilaterally rejected this privilege…",
          "</aside>",
          "",
          "An important topic arises: **how should those who are privileged confront their own privilege?**",
          "",
          "Today, anyone with access to higher education inevitably occupies a privileged position.",
          "This privilege arises not only from personal effort but also from family resources, regional educational opportunities, and other external factors.",
          "For me, this privilege is undeniable.",
          "**So how can one be a sincere (at least non-annoying) member of the privileged class?**",
          "",
          "Eric's answer: mere guilt does nothing to change injustice. What truly matters is taking action.",
          "I strongly agree, but I don't believe everyone needs to become a leftist Marxist to address this.",
          "I have two simple thoughts.",
          "",
          "First, it is necessary to **recognize** and **admit (to oneself)** one's own privilege—this is fundamental.",
          "People may deliberately or unconsciously **forget** their privileged status to protect themselves or out of guilt (I agree with Eric: being in a privileged position is not a sin).",
          "But such ignorance is, in the end, unpleasant.",
          "",
          "Second, privilege allows you to more easily do “certain things,” but we must judge carefully whether these actions are worth taking.",
          "For example: preserving one's life (Eric), a famous leftist philosopher selling courses (Žižek), or writing a program to automatically grab tickets.",
          "(I am not alluding to any of these; this is a neutral example.)",
          "Although no one can understand every situation fully, it is important to distinguish between having privilege and exercising it.",
          "",
          "Ultimately, privilege is not original sin, but ignoring or abusing it is a failure of responsibility.",
          "",
          "### **Be Goofy**",
          "Throughout the book, Eric's humor shines through.",
          "Few people would describe bone marrow transplantation as a new resident moving into a house, compare cancer symptoms to Africa's Big Five while claiming to have “collected” all the symptoms, or imagine a lead-lined isolation room during chemotherapy as an astronaut's landing procedure.",
          "Sometimes, I felt he displayed the idealistic “goofiness” common among researchers.",
          "",
          "At the end of the book (also at the end of his life), Eric discusses the value of “Goofiness.”",
          "",
          "<aside>",
          "Goofiness as part of a way of life was really important to me…A closely related term is silly.",
          "It means having, as part of your way of life, something to counter the dead seriousness of our human condition, to make life fun and funny and not to take everything so seriously.",
          "</aside>",
          "",
          "He continues with a passage I find crucial:",
          "",
          "<aside>",
          "I do take the world very seriously…That's taking the way of life as something important, and you have to devote attention to it.",
          "But there's so much that's hard in the world and difficult…",
          "So goofiness for me has always been a way of lightening things up.",
          "It doesn't mean “don't be so serious”. It means, “in addition to being serious, have a lughthearted view of life as well as a serious one.”",
          "</aside>",
          "",
          "To “be goofy” does not mean adopting a “don't take life seriously” attitude; it means maintaining a lighthearted perspective on **life** while still taking **existence** seriously.",
          "",
          "Being goofy is not easy; it can be seen as a kind of practice.",
          "Complaining that the world is a pile of crap is easy.",
          "I mean: it is easy to adopt a negative attitude toward the world.",
          "**You simply fall into entropy along with the world; this happens naturally without extra effort.**",
          "",
          "Maintaining a clear awareness of the world while keeping a humorous, lighthearted attitude is itself beautiful—I want to exist in the world in this manner.",
          "To quote Eric: *I feel that I live a more joyful life because I live this way.*",
          "",
          "### **If love is false, there is nothing.**",
          "Eric's witty writing can make the reader forget he was suffering daily from acute leukemia.",
          "Yet the enormous physical and mental pain forms the underlying tone of this struggle.",
          "While Eric's depth partly masks the sharpness of reality, at the fragile edge of life, that terrifying baseline emerges again.",
          "",
          "Eric honestly recorded moments of his breakdown.",
          "In ***page 217, “A very disturbing, bleak moment,”*** he rarely describes an experience of utter despair:",
          "",
          "<aside>",
          "… I was sleeping yesterday afternoon and had an extremely brief dream snippet,…",
          "",
          "…It was a malevolent scene, not a story: I opened a door to a room that was filled woth everyone I love and who loves me——all my immediate family, grandchildren, extended family, friends, students, colleagues. Everyone.",
          "And they were all laughing at me, mocking my efforts to understand my illness in my blog, saying I was ridiculous…",
          "",
          "I let out a scream and woke up sobbing, gasping.",
          "",
          "…",
          "",
          "This, I feel, was the worst nightmare possible: the very foundation of my life, love, became empty.",
          "I have firmer beliefs in the love experience in the world than in my critique of capitalism.",
          "If love is false, there is nothing.",
          "</aside>",
          "",
          "Eric keenly sensed the essence of this despair: this scene shattered the foundation of his beliefs and life—the love from those around him.",
          "Love, or what I like to call ***deep connection with others,*** is **immensely important.**",
          "",
          "This reminds me of Zhan Qingyun's line on *Qi Pa Shuo*: “What kind of great future is worth missing every season?”",
          "Though somewhat stylized because it's from a variety show, it touches on core questions of what truly matters.",
          "Most derivative discussions focus on the “love vs. career” dilemma.",
          "But why limit the discussion to these two?",
          "Doing so would make my thinking more narrow and trivial.",
          "",
          "Alas, language is like dimensional reduction.",
          "If the essence of things is an X-dimensional vector, what we perceive is already dimensionally reduced (dimension ≤ X–1).",
          "Language—a crude sieve—compresses all complexity into a two-dimensional plane.",
          "When we rush to fix reality into labels like “love” or “career,” we are already trapped in a maze.",
          "",
          "…",
          "",
          "My thoughts are a bit scattered.",
          "This discussion does not really belong in a reading note.",
          "",
          "I just want to say: in those aspects that language cannot express, such as Eric's lonely dream, there may flow a most real existence, flowing with deep connection to others, or in other words, love.",
          "",
          "### **The disappearance of existence**",
          "Here is an excerpt of the most striking passage from the book:",
          "",
          "<aside>",
          "Human life is a wild, extraordinary phenomenon: elements are brewed in the center of stars and exploding supernova, spewed across the universe;",
          "they eventually clumped into a minor planet around a modest star;",
          "then after some billions of years this “stardust” became complex molecules with self-replicating capacities that we call life…",
          "That I, as a conscious being will cease to exist pales in significance to the fact that I exist at all.",
          "I don't find that this robs my existence of meaning; it's what makes infusing life with meaning possible.",
          "</aside>",
        ],
      },
    },
  ];

  const loadWritingsFromFiles = async () => {
    try {
      const res = await fetch(`./writings/index.json?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return false;
      const json = await res.json();
      const entries = Array.isArray(json?.entries) ? json.entries : [];
      if (entries.length === 0) return false;

      const loaded = [];
      for (const entry of entries) {
        const id = typeof entry?.id === "string" ? entry.id.trim() : "";
        const title = typeof entry?.title === "string" ? entry.title.trim() : "";
        const files = entry?.files && typeof entry.files === "object" ? entry.files : {};
        if (!id || !title) continue;

        const linesByLang = {};
        for (const lang of Object.keys(files)) {
          const filePath = files[lang];
          if (typeof filePath !== "string" || !filePath.trim()) continue;
          try {
            const fileRes = await fetch(`${filePath}?v=${Date.now()}`, { cache: "no-store" });
            if (!fileRes.ok) continue;
            const text = await fileRes.text();
            linesByLang[lang] = text.replace(/\r\n/g, "\n").split("\n");
          } catch (_) {
            // ignore one broken file, keep trying other language files
          }
        }

        if (Object.keys(linesByLang).length > 0) {
          loaded.push({ id, title, linesByLang });
        }
      }

      if (loaded.length > 0) {
        writingsEntries = loaded;
        state.writingsCursor = 0;
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  const bootstrap = async () => {
    await loadWritingsFromFiles();
  };
  void bootstrap();

  const openExternal = (key) => {
    const map = {
      github: "https://github.com/yourname",
      x: "https://x.com/yourname",
    };
    const url = map[key];
    if (!url) {
      printLine(`unknown external key: ${key} (available: ${Object.keys(map).join(", ")})`, "error");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    printLine(`OPENED_ ${key}`, "ok");
  };

  const setSection = (label) => {
    state.section = label;
    if (promptPath) promptPath.textContent = label;
  };

  const inWritingSubpage = () =>
    Boolean(state.currentWritingId) &&
    state.section === `writings/${state.currentWritingId}`;

  const WRITINGS_HINT_1 =
    "Use ↑↓ to choose which note to read from the list below.";
  const WRITINGS_HINT_2 =
    "After entering each article, the default language is Chinese (zh), but you can type eng to switch to English or jap to switch to Japanese.";

  const printWritingsIndex = () => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      printLine(WRITINGS_HINT_1, "dim");
      printLine(WRITINGS_HINT_2, "dim");
    } else {
      const hintEl1 = appendEmptyLine("dim");
      const hintEl2 = appendEmptyLine("dim");
      const h1 = measureLineHeightForText(WRITINGS_HINT_1, "dim");
      const h2 = measureLineHeightForText(WRITINGS_HINT_2, "dim");
      if (h1 > 0) hintEl1.style.minHeight = `${h1}px`;
      if (h2 > 0) hintEl2.style.minHeight = `${h2}px`;
      void typewriterFillLineEl(hintEl1, WRITINGS_HINT_1).then(() =>
        typewriterFillLineEl(hintEl2, WRITINGS_HINT_2)
      );
    }

    if (writingsEntries.length === 0) {
      printLine("writings/:");
      printLine("  (empty)");
      state.writingsIndexEls = [];
      return;
    }
    if (state.writingsCursor < 0) state.writingsCursor = 0;
    if (state.writingsCursor >= writingsEntries.length) state.writingsCursor = writingsEntries.length - 1;

    const formatEntry = (idx) => {
      const w = writingsEntries[idx];
      const marker = idx === state.writingsCursor ? ">" : " ";
      return `${marker} ${w.id}  -  ${w.title}`;
    };

    printLine("writings/:");
    state.writingsIndexEls = writingsEntries.map((_, idx) => {
      const el = printLine(formatEntry(idx));
      if (idx === state.writingsCursor) el.classList.add("cursor-line");
      return el;
    });
  };

  const refreshWritingsCursor = () => {
    if (!state.writingsIndexEls || state.writingsIndexEls.length === 0) return;
    if (state.writingsCursor < 0) state.writingsCursor = 0;
    if (state.writingsCursor >= writingsEntries.length) state.writingsCursor = writingsEntries.length - 1;

    state.writingsIndexEls.forEach((el, idx) => {
      const w = writingsEntries[idx];
      const marker = idx === state.writingsCursor ? ">" : " ";
      el.textContent = `${marker} ${w.id}  -  ${w.title}`;
      el.classList.toggle("cursor-line", idx === state.writingsCursor);
    });
  };

  const openWritingByCursor = () => {
    if (state.section !== "writings") return;
    if (writingsEntries.length === 0) {
      printLine("writings is empty", "error");
      return;
    }
    const item = writingsEntries[state.writingsCursor];
    if (!item) return;
    state.currentWritingId = item.id;
    state.lang = "zh";
    setSection(`writings/${item.id}`);
    renderWriting(item);
  };

  const getWritingLinesByLang = (item, lang) => {
    if (item.linesByLang && item.linesByLang[lang]) return item.linesByLang[lang];
    if (item.linesByLang && item.linesByLang.zh) return item.linesByLang.zh;
    return item.lines || [];
  };

  const renderWriting = (item) => {
    const lines = getWritingLinesByLang(item, state.lang);
    const startEl = printLine(`--- ${item.title} [${item.id}] (${state.lang}) ---`, "glow");
    let inAside = false;
    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed === "<aside>") {
        inAside = true;
        return;
      }
      if (trimmed === "</aside>") {
        inAside = false;
        return;
      }
      if (trimmed.startsWith("### ")) {
        printMdLine(trimmed.slice(4), "md-h3");
        return;
      }
      if (trimmed === "***") {
        printMdLine("────────────────────────", inAside ? "md-callout md-sep" : "md-sep");
        return;
      }
      if (inAside || trimmed.startsWith("> ")) {
        const content = trimmed.startsWith("> ") ? line.replace(/^>\s?/, "") : line;
        printMdLine(content, "md-callout");
        return;
      }
      printMdLine(line);
    });
    printLine("--- end ---", "muted");
    // 打开文章后从标题处开始阅读，而不是停在底部
    requestAnimationFrame(() => {
      if (!startEl) return;
      body.scrollTop = Math.max(0, startEl.offsetTop - 2);
    });
  };

  const renderPublications = () => {
    let startEl = null;
    const dangerHeadings = new Set([
      "**Research Presentation**",
      "**Publications**",
      "**Awards**",
    ]);
    content.publications.forEach((l, idx) => {
      const cls = dangerHeadings.has(l)
        ? "danger"
        : (l.endsWith("_") ? "glow" : undefined);
      const el = printMdLine(l, cls);
      if (idx === 0) startEl = el;
    });
    // 打开 publications 后回到开头阅读
    requestAnimationFrame(() => {
      if (!startEl) return;
      body.scrollTop = Math.max(0, startEl.offsetTop - 2);
    });
  };

  const run = (raw) => {
    const cmdline = normalize(raw);
    if (!cmdline) return;

    state.history.push(cmdline);
    state.historyIdx = state.history.length;

    printPromptEcho(cmdline);

    const [cmd, ...args] = cmdline.split(" ");
    const arg0 = (args[0] || "").toLowerCase();

    switch (cmd.toLowerCase()) {
      case "help":
      case "?":
        printLine("COMMANDS_");
        printLine("");
        printLine("  intro             show introduction");
        printLine("  help              show this help");
        printLine("  home              go back to startup screen (reload)");
        printLine("  clear             clear screen");
        printLine("  ls                list sections in current folder");
        printLine("  pwd               print current folder");
        printLine("  cd <section>      change folder (base / cv / writings / publications / links)");
        printLine("  cv                show cv (shortcut, same as cd cv)");
        printLine("  writings          enter writings folder");
        printLine("  read <id>         read a writing when in /writings");
        printLine("  eng               switch current writing to English");
        printLine("  jap               switch current writing to Japanese");
        printLine("  zh                switch current writing to Chinese");
        printLine("  publications      show publications & awards");
        printLine("  links             show links");
        printLine("  open <key>        open external (e.g. open github)");
        break;
      case "ls":
        if (state.section === "base") {
          printLine("SECTIONS_");
          printLine("  intro");
          printLine("  cv");
          printLine("  writings");
          printLine("  publications");
          printLine("  links");
        } else if (state.section === "cv") {
          printLine("cv/:");
          printLine("  cv (virtual file)");
        } else if (state.section === "writings") {
          printWritingsIndex();
        } else if (state.section.startsWith("writings/")) {
          printLine(`${state.section}/:`);
          printLine("  eng");
          printLine("  jap");
          printLine("  zh");
          printLine("  cd ..");
        } else if (state.section === "publications") {
          printLine("publications/:");
          printLine("  publications (virtual file)");
        } else if (state.section === "links") {
          printLine("links/:");
          printLine("  links (virtual file)");
        }
        break;
      case "read": {
        if (state.section !== "writings") {
          printLine("read: only available inside /writings (cd writings first)", "error");
          break;
        }
        const id = arg0;
        if (!id) {
          printLine("usage: read <id>   (see ids via 'ls' in /writings)", "error");
          break;
        }
        const item = writingsEntries.find((w) => w.id === id);
        if (!item) {
          printLine(`read: unknown id '${id}' in /writings`, "error");
          break;
        }
        state.currentWritingId = item.id;
        state.lang = "zh";
        setSection(`writings/${item.id}`);
        renderWriting(item);
        break;
      }
      case "eng":
      case "en": {
        if (!inWritingSubpage()) {
          printLine("eng: available only inside a writing subpage (read <id> first)", "error");
          break;
        }
        const item = writingsEntries.find((w) => w.id === state.currentWritingId);
        if (!item) {
          printLine("eng: current writing not found", "error");
          break;
        }
        if (!(item.linesByLang && item.linesByLang.eng)) {
          printLine("Not Available for Now...", "dim");
          break;
        }
        state.lang = "eng";
        renderWriting(item);
        break;
      }
      case "jap":
      case "ja": {
        if (!inWritingSubpage()) {
          printLine("jap: available only inside a writing subpage (read <id> first)", "error");
          break;
        }
        const item = writingsEntries.find((w) => w.id === state.currentWritingId);
        if (!item) {
          printLine("jap: current writing not found", "error");
          break;
        }
        if (!(item.linesByLang && item.linesByLang.jap)) {
          printLine("Not Available for Now...", "dim");
          break;
        }
        state.lang = "jap";
        renderWriting(item);
        break;
      }
      case "zh":
      case "cn": {
        if (!inWritingSubpage()) {
          printLine("zh: available only inside a writing subpage (read <id> first)", "error");
          break;
        }
        const item = writingsEntries.find((w) => w.id === state.currentWritingId);
        if (!item) {
          printLine("zh: current writing not found", "error");
          break;
        }
        if (!(item.linesByLang && item.linesByLang.zh)) {
          printLine("Not Available for Now...", "dim");
          break;
        }
        state.lang = "zh";
        renderWriting(item);
        break;
      }
      case "pwd":
        printLine(`/` + state.section, "muted");
        break;
      case "cd": {
        const rawTarget = arg0 || "base";
        const target = (rawTarget || "")
          .toLowerCase()
          .replace(/^\/+|\/+$/g, ""); // 去掉前后斜杠，兼容 cd /cv/ 之类
        // go home
        if (["base", "/", "~", "home"].includes(target)) {
          setSection("base");
          state.currentWritingId = null;
          printLine("moved to /base", "muted");
          break;
        }
        if (target === "..") {
          if (state.section.startsWith("writings/")) {
            setSection("writings");
            state.currentWritingId = null;
            printLine("moved to /writings", "muted");
            printWritingsIndex();
          } else {
            setSection("base");
            state.currentWritingId = null;
            printLine("moved to /base", "muted");
          }
          break;
        }
        if (target === "cv") {
          setSection("cv");
          state.currentWritingId = null;
          printLine("moved to /cv", "muted");
          content.cv.forEach((l) => printLine(l, l.endsWith("_") ? "glow" : undefined));
          break;
        }
        if (["writing", "writting", "writtings", "writings"].includes(target)) {
          setSection("writings");
          state.currentWritingId = null;
          printLine("moved to /writings", "muted");
          printWritingsIndex();
          break;
        }
        if (target === "publications") {
          setSection("publications");
          state.currentWritingId = null;
          printLine("moved to /publications", "muted");
          renderPublications();
          break;
        }
        if (target === "links") {
          setSection("links");
          state.currentWritingId = null;
          printLine("moved to /links", "muted");
          content.links.forEach((l) => printLine(l, l.endsWith("_") ? "glow" : undefined));
          break;
        }
        printLine(`cd: no such section: ${target}`, "error");
        break;
      }
      case "intro":
        setSection("base");
        state.currentWritingId = null;
        content.intro.forEach((l) => printLine(l, l.endsWith("_") ? "glow" : undefined));
        break;
      case "clear":
        body.innerHTML = "";
        break;
      case "cv":
        setSection("cv");
        state.currentWritingId = null;
        content.cv.forEach((l) => printLine(l, l.endsWith("_") ? "glow" : undefined));
        break;
      case "writing":
      case "writting":
      case "writtings":
      case "writings":
        setSection("writings");
        state.currentWritingId = null;
        printLine("moved to /writings", "muted");
        printWritingsIndex();
        break;
      case "publications":
        setSection("publications");
        state.currentWritingId = null;
        renderPublications();
        break;
      case "links":
        setSection("links");
        state.currentWritingId = null;
        content.links.forEach((l) => printLine(l, l.endsWith("_") ? "glow" : undefined));
        break;
      case "open":
        if (!arg0) {
          printLine("usage: open github", "error");
          break;
        }
        openExternal(arg0);
        break;
      case "home":
        window.location.reload();
        break;
      default:
        printLine(`command not found: ${cmd} (type 'help')`, "error");
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    run(v);
  });

  input.addEventListener("keydown", (e) => {
    if (state.section === "writings" && input.value.trim() === "") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (writingsEntries.length === 0) return;
        state.writingsCursor = Math.max(0, state.writingsCursor - 1);
        refreshWritingsCursor();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (writingsEntries.length === 0) return;
        state.writingsCursor = Math.min(writingsEntries.length - 1, state.writingsCursor + 1);
        refreshWritingsCursor();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        openWritingByCursor();
        return;
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.history.length === 0) return;
      state.historyIdx = Math.max(0, state.historyIdx - 1);
      input.value = state.history[state.historyIdx] ?? "";
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state.history.length === 0) return;
      state.historyIdx = Math.min(state.history.length, state.historyIdx + 1);
      input.value = state.history[state.historyIdx] ?? "";
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    }
  });

  // click anywhere to focus
  document.addEventListener("mousedown", () => input.focus());
  input.focus();
})();

