/* ============================================================================
   CONTENT — the only file you edit. Save and reload, no build step.

   ADD A BLOG POST       copy this into the posts list below
       {
         date: "2026-12-01",
         title: "Title of the post",
         body: `
   First paragraph.

   Second paragraph.
   `
       },

   ADD A PROJECT         copy this into the projects list below
       {
         name: "Project name",
         image: "img/shot.webp",
         body: `
   What it is and what you did.
   `
       },

   That is the whole requirement. Blank lines separate paragraphs. Everything
   else is optional and worked out for you: the link, the one-line summary,
   the reading time.

   A PICTURE inside a body — put it on its own line:
       ![Caption goes here](img/file.png)
   Add {light} after it for a chart or screenshot that has a white background
   of its own:
       ![Caption](img/chart.png) {light}

   OPTIONAL EXTRAS
     posts      read, excerpt, id
     projects   tag, title, result, stack, blurb, id,
                links: [["GitHub", "https://..."]]
   ============================================================================ */

window.SITE = {

  author: "Kaleb Kim",

  /* the PROFILE panel: [label, value, sub] — sub is the dimmer part after | */
  profile: [
    /* A row is [label, value] and may add two more:
         [label, value, "dim trailing text", "img/logo.svg", "alt text"]
       Pass "" for the dim text if you only want the logo. Any colour of
       logo works, it is flattened to white and set to one height. */
    ["Discipline", "B.S. Computer Engineering", "", "img/tamu.png", "Texas A&M University"],
    ["Focus", "Embedded systems"],
    ["Role", "System design intern", "", "img/lockheed.png", "Lockheed Martin"]
  ],

  /* The address is kept in three pieces and only joined when someone presses
     Copy, so it never sits in the page as text for a scraper to find. Edit the
     pieces. Never write it out as one string. */
  email: ["caeroseoul", "outlook", "com"],

  links: [
    ["LinkedIn", "linkedin.com/in/kalebtkim", "https://www.linkedin.com/in/kalebtkim/"],
    ["GitHub", "@kalebtkim", "https://github.com/kalebtkim"]
  ],

  projects: [

  ],

  posts: [

    {
      date: "2026-11-21",
      title: "Professional Networking",
      body: `
I started going into random Discord servers and Reddit forums not really knowing who to talk to about the typical development questions I had, and I honestly felt pretty lost on what I exactly wanted to do almost a year before now.

What I do for professional networking that sets me apart, I feel like, is more on the lengths I'll go to actually have a conversation with someone in person. I started finalizing my niche or area of interest or whatever when summer break started, and I started joining a lot of developer forums and Discord servers that were more concentric to my needs for software development, like servers for C++ or adjacent fields that use C/C++. I started meeting up with these people from these servers in person, which was admittedly pretty scary and numbing at first.

I remember my first coffee chat was actually internal inside of my workplace at Lockheed. It was a mechanical engineer who had just recently graduated, and I originally thought I cared about mechanical engineering. I quickly found out that I didn't really care as much as I should to even pursue ME in the first place, so I gave that up quick, but talking to him and asking him out to lunch was really interesting for me, and for once, without feeling like someone was peering over my shoulder or glaring at my throat, our conversation was really informative and natural and fun. I also found out that I went to the same middle school and high school as his nephew, which was pretty cool.

I think what snowballed my progression in terms of networking the most was mainly when school started and I now had access to meet so many more people in person and also could find Discord servers that were specific for A&M, and I started to actually use LinkedIn how it was originally intended, which was to just find and hit up people.

Through the last few months, some notable coffee chats I had were with this SpaceX engineer that I met through LinkedIn, and we met up at an A&M game, and then we met up with each other with his girlfriend in Austin for dinner on Halloween. That experience alone was fantastic, and he was really pushing to give me a referral for whenever I was ready, which I told him was most likely next intern cycle anyway. I also went to an in-person seminar where I got to talk to one of the leads for the VIPER rover, and he has almost 2 decades worth of experience working at NASA's Houston space center, and I also found out that he was a mentor for FRC 118, Robonauts, which was cool because I also did FRC and would see their team dominate pretty much every year. I'm also just recently being mentored by not only the SpaceX engineer but also a previous product design lead at Apple, and he's working on his own personal project now that he's looking for a different direction, and he's teaching me some interesting things about frontend development, which might sound stale to some people, but it's not for me.

I've also had a high amount of people that actually responded to my cold messages and connects. I never email because I think that's more of an inconvenience at times and feels a little too personal. I think LinkedIn and Discord are doing just fine for me.

![Cold outreach, and where it went.](img/post-outreach.png) {light}

In total, I feel like I'm more levelheaded on different industries from the amount of exposure I've had ever since my freshman year started. Just to test out my baseline, I decided to apply to some high tier companies, and in terms of final rounds, I got a software internship interview with RTX, which was pretty unfortunate because I had to push it forward but somehow got my interview extended, but I also got an offer from this smaller tech company with just doing 1 interview somehow. I turned down another offer from some Korean aerospace company as well that's based in California, which was pretty cool to hear from, especially as someone that's Korean as well.

![Referrals through to offers.](img/post-outcomes.png) {light}

At some point though, my methodology for meeting and chatting with these people from different industries definitely took a toll on my grades and my time, but I'm glad I set a standard for myself not to try to pry and get a referral or whatever from someone I'm trying to talk to, but instead, like I mentioned before, just try to gain industry exposure from them and literally ask them exactly how they got to the position they're in and what exactly they did to get their previous positions, because I feel like getting your foot in the door is the hardest thing of all time.
`
    }

  ]
};
