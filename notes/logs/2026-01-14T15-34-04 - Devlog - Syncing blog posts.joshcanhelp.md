## References

- [Publishing Obsidian notes](https://github.com/joshcanhelp/md-note-mapper)

---

This was the main reason I wanted to build this project so it's time to try it out. I want to be able to store blog posts as log notes in [Obsidian](https://obsidian.md). A few things to address:

- Tags in Obsidian can't have spaces but the blog does
- If I want to see a preview of the post using the local server, I'll need to sync it over. I don't want to have to do that manually all the time so I want to figure out some way to watch blog files and sync on change
- The file format for logs in my vault are different than the blog so I'll need to deal with that somehow. I probably need a file name filter of some kind.

I'm guessing I'll need some changes to `mdsync` so I'll link the project locally.

```bash
npm install --save-dev ~/Code/mdsync
npm exec mdsync scan
```

An init command would be nice, I'll get [Claude](https://claude.ai) started on that.

As usual, once I start working with Claude on this thing, we go into a tunnel and get a bunch of stuff done. That's definitely a good thing and I'm still enjoying the process and still experiencing some discomfort around not know every part of this system. 

Some thoughts:

- This particular piece of software is uniquely suited to this experiment since all of the output (synced MD files) can be examined. I can see immediately if something is not mapping properly in the diff. That is making me move faster and delegate more to Claude, there's nothing that can go wrong that I can't catch before putting it out.
- More and more it's feeling like the place where I can be most useful in this workflow is making sure there is scaffolding to keep the project in check. It feels very much like working with a fast mid-tier developer. Tests, linting, smaller methods, smaller changesets ... all those things make it easier to understand what's happening in a single change and make adjustments. I think there is a lot more that I could be doing here.
- Along the same lines, the instructions that I'm collecting for the agent are important as well (`DESIGN.md`, `CHOP.md` and `CLAUDE.md`). The first is meant for both people and agents, the second is a general workflow that can be used across projects, and the third is just for this project. Then the `README.md` is entirely for people (and should not, for the most part, be edited by the agent). What happens, though, is that the agent will write a *ton* of text somewhere and it's not fun to review it. Next [CHOP](https://sourcegraph.com/blog/chat-oriented-programming-in-action) project I'll take a step back and put these together more deliberately.
- The very fast progress because somewhat addictive, in a sense, and I start to not want to do certain things by hand, like update the README. Not because I don't like the process but because feeding more to Claude and getting more features feels more productive. I can imagine, for those who don't enjoy technical writing, that skipping those tasks entirely would be a big relief but, of course, now you have all the human-facing english written by an LLM and that's not great.