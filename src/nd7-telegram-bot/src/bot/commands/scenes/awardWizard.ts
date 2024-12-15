import { Composer, Context, Scenes, Markup } from "telegraf";
import { ScoreService } from "../../services/scoringService";
import { message } from "telegraf/filters";

interface AwardWizardSession extends Scenes.WizardSessionData {
  recipient?: string; // Stores username of the recipient
  token?: string;     // Stores token entered by the user
}

// Define custom Context that extends the WizardContext
export interface MyWizardContext extends Context {
  scene: Scenes.SceneContextScene<MyWizardContext, AwardWizardSession>;
  wizard: Scenes.WizardContextWizard<MyWizardContext>;
}

// Step 2 handler with Composer
const recipientStepHandler = new Composer<MyWizardContext>();

recipientStepHandler.on(message('text'), async (ctx) => {
  const recipient = ctx.message?.text;
  if (!recipient?.startsWith("@")) {
    return ctx.reply("❌ Invalid username! It should start with '@'. Please try again.");
  }

  // Save recipient in wizard session
  ctx.scene.session.recipient = recipient;
  await ctx.reply(`✅ Got it! Now enter the token or score ID for "@${recipient}":`);
  return ctx.wizard.next(); // Move to next step
});

recipientStepHandler.use((ctx) => {
  return ctx.reply("❌ Sorry, that's not a valid input. Please provide a username starting with '@'.");
});

const tokenStepHandler = new Composer<MyWizardContext>();

tokenStepHandler.on(message('text'), async (ctx) => {
  const token = ctx.message?.text;
  if (!token?.match(/^[a-zA-Z0-9]+$/)) {
    return ctx.reply("❌ Invalid token! It should contain only alphanumeric characters. Please try again.");
  }

  // Save token to session
  ctx.scene.session.token = token;

  await ctx.reply(
    `You're awarding a goal to ${ctx.scene.session.recipient} with token "${ctx.scene.session.token}".\n`,
    Markup.inlineKeyboard([
      Markup.button.callback("✅ Confirm", "CONFIRM_AWARD"),
      Markup.button.callback("❌ Cancel", "CANCEL_AWARD"),
    ])
  );
  return ctx.wizard.next();
});

tokenStepHandler.use((ctx) => {
  return ctx.reply("❌ Invalid input. Please enter a valid alphanumeric token.");
});

// Confirmation step for inline buttons
const confirmationStepHandler = new Composer<MyWizardContext>();

confirmationStepHandler.action("CONFIRM_AWARD", async (ctx) => {
  try {
    const { recipient, token } = ctx.scene.session;

    await ScoreService.awardGoalToMember(
      token!,
      ctx.from!.username || "Unknown User",
      recipient!
    );
    await ctx.reply(`🎉 Successfully awarded a goal to ${recipient}!`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Failed to award goal: ${errorMessage}`);
  } finally {
    ctx.answerCbQuery(); // Acknowledge inline button press
    ctx.editMessageReplyMarkup({
      inline_keyboard:[]
    })
    return ctx.scene.leave();
  }
});

confirmationStepHandler.action("CANCEL_AWARD", async (ctx) => {
  await ctx.reply("❌ Award process cancelled.");
  ctx.answerCbQuery(); // Acknowledge inline button press
  return ctx.scene.leave();
});

confirmationStepHandler.use((ctx) => {
  return ctx.reply("🤔 Please use the buttons to confirm or cancel.");
});

// Setting up the WizardScene
export const awardWizard = new Scenes.WizardScene(
  "AWARD_WIZARD_SCENE_ID",
  async (ctx) => {
    // Step 1: Introduction
    await ctx.reply("👤 Who would you like to award a goal to? Provide their username (e.g., @username):");
    return ctx.wizard.next(); // Move to Step 2
  },
  recipientStepHandler, // Step 2: Collect recipient
  tokenStepHandler,     // Step 3: Collect token
  confirmationStepHandler // Step 4: Confirmation via inline buttons
);

export default awardWizard;