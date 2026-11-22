export type ReuseSuggestionInput = {
  description: string
  question: string
  skill: string
  imageAttached: boolean
}

export type ReuseSuggestion = {
  message: string
  ideas: string[]
  provider: 'local rules'
  imageAnalysed: false
}

export interface ReuseProvider {
  suggest(input: ReuseSuggestionInput): Promise<ReuseSuggestion>
}

/** Local fallback for the MVP. It uses typed description text and never analyses the uploaded image. */
export const localReuseProvider: ReuseProvider = {
  async suggest({ description, question, skill }) {
    const text = `${description} ${question}`.toLowerCase()
    let ideas: string[]
    if (/shirt|cloth|fabric|trouser|textile/.test(text)) ideas = skill.toLowerCase().includes('sew')
      ? ['Join strong fabric panels into a reusable shopping bag.', 'Turn the best sections into a cushion cover or storage organiser.', 'Patch a wearable piece or combine panels into redesigned clothing.', 'If fabric is unsuitable for reuse, offer clean textiles to a local material buyer.']
      : ['Wash and pass wearable clothing to an organisation after confirming its needs.', 'Use intact fabric for dust cloths or simple household covers.', 'Ask a tailor about a repair before discarding it.', 'Keep damaged textiles separate and check whether a local recovery route accepts them.']
    else if (/bottle|pet|plastic/.test(text)) ideas = ['Cut a clean PET bottle into a seedling pot with drainage holes.', 'Use a capped bottle as a simple slow-drip watering container for a garden bed.', 'Reuse only clean, food-safe containers for suitable household storage.', 'Rinse, dry and sort recyclable bottles by polymer where a buyer accepts them.']
    else if (/glass/.test(text)) ideas = ['Reuse an intact jar for dry storage after a thorough wash.', 'Use a glass bottle as a vase if it has no chips or cracks.', 'Wrap broken glass securely and keep it out of mixed recycling; follow local handling guidance.', 'Check local collection options before transporting glass.']
    else if (/tyre/.test(text)) ideas = ['Check whether a tyre recovery service can collect it for material recovery.', 'If repurposing outdoors, prevent water pooling and mosquito breeding.', 'Use only if it is structurally sound and secured; avoid burning or cutting without suitable tools.', 'Keep it dry and away from fire until a recovery route is confirmed.']
    else if (/paper|cardboard|box/.test(text)) ideas = ['Keep dry and flatten clean cardboard for reuse or recycling.', 'Turn sturdy boxes into drawer dividers or storage organisers.', 'Reuse clean paper for packing or school craft projects.', 'Keep food-soiled or wax-coated items out of paper recycling unless a buyer accepts them.']
    else if (/wood/.test(text)) ideas = ['Use sound untreated wood for a small repair or shelf after checking for nails and splinters.', 'Offer usable offcuts to a repair workshop or crafts group.', 'Do not burn painted, treated or unknown wood indoors.', 'Separate contaminated or treated pieces and ask a local recovery operator.']
    else if (/container|chemical|hazard/.test(text)) ideas = ['Do not reuse containers that held pesticides, fuels, solvents or other hazardous chemicals for food or water.', 'Keep the container sealed and follow local hazardous-waste guidance.', 'Do not rinse residues into a drain or garden.', 'Ask the relevant authority or supplier about safe handling.']
    else ideas = ['First identify the material and check whether it is clean, dry and safe to handle.', 'Look for a repair, refill or second-use option before recycling.', 'Separate it from residual waste and ask a nearby buyer whether they accept it.', 'Avoid food or water reuse when the original contents are unknown or hazardous.']

    return {
      message: 'Here are some practical options based on your description. Check the item’s material and safety before trying them.',
      ideas,
      provider: 'local rules',
      imageAnalysed: false,
    }
  },
}
