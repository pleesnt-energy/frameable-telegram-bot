import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const scoreboardDatabaseID = process.env.SCOREBOARD_DATABASE_ID;
if (!scoreboardDatabaseID) {
    console.error("❌ ERROR: NOTION_DATABASE_ID is not set in environment variables.");
    process.exit(1); // Ensure the script terminates
}

export const ScoreService = {
  async tallyGoals() {
    const goalsByUser: { [key: string]: number } = {};
    const response = await notion.databases.query({
      database_id: scoreboardDatabaseID ?? "",
      filter: {
        property: "EventCategory",
        select: { equals: "GoalAwarded" },
      },
    });

    response.results.forEach((entry: any) => {
      const target = entry.properties.Target.rich_text[0]?.plain_text.trim();
      goalsByUser[target] = (goalsByUser[target] || 0) + 1;
    });

    return goalsByUser;
  },

  async awardGoalToMember(token: string, sender: string, target: string) {
    const isTokenValid = await this.validateToken(token, sender);
    if (!isTokenValid) throw new Error("Invalid token!");

    return await notion.pages.create({
      parent: { database_id: scoreboardDatabaseID ?? "" },
      properties: {
        Operator: { type: "title", title: [{ type: "text", text: { content: "1" } }] },
        Source: { rich_text: [{ type: "text", text: { content: token } }] },
        Target: { rich_text: [{ type: "text", text: { content: target } }] },
        EventCategory: { select: { name: "GoalAwarded" } },
      },
    });
  },

  async validateToken(token: string, sender: string) {
    const response = await notion.databases.query({
      database_id: scoreboardDatabaseID,
      filter: {
        and: [
          { property: "Source", rich_text: { equals: token } },
          { property: "EventCategory", select: { equals: "TokenIssued" } },
        ],
      },
    });

    return response.results.length > 0;
  },
};