export type PublishFeedStatus =
  // The feed has started publishing articles.
  | 'PublishArticles'

  // The feed has started publishing keywords.
  | 'PublishKeywords'

  // The feed has been successfully published.
  | 'Succeed'

  // The feed failed to publish.
  | 'Failed';
