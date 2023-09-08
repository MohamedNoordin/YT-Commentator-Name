class YouTubeObserver {

	featuredHandledComments = [];

	constructor () {
		this.featuredHandledComments = [];
	}

	async observe() {
		// Create a new MutationObserver instance
		// To be notified when a new comment has been added to the DOM
		const observer = new MutationObserver((mutations, observer) => {
			mutations.forEach(async(mutation) => {
				const addedNodes = Array.from(mutation.addedNodes);
				const comments = addedNodes.filter(node => node.tagName === "YTD-COMMENT-RENDERER");
				const featuredComments = Array.from(document.getElementsByTagName("YTD-AUTHOR-COMMENT-BADGE-RENDERER"));

				await Promise.all([
					this.observeForfeaturedComments(featuredComments),
					this.observeForComments(comments)
				]);
			});
		});

		// Configure the MutationObserver to observe subtree changes
		const config = { childList: true, subtree: true };
		observer.observe(document.body, config);
	}

	async observeForfeaturedComments(featuredComments) {
		if (featuredComments.length > 0) {
			featuredComments.forEach(async(comment) => {
				const featuredCommentChannelAnchor = comment.querySelector("A");
				if (featuredCommentChannelAnchor) {
					const featuredCommentChannelHref = featuredCommentChannelAnchor.getAttribute("href");
					const featuredCommentChannelIDFormattedString = comment.querySelector("YT-FORMATTED-STRING");
					if (featuredCommentChannelIDFormattedString && !this.featuredHandledComments.includes(featuredCommentChannelHref)) {
						this.featuredHandledComments.push(featuredCommentChannelHref);
						const response = await fetch("https://www.youtube.com/" + featuredCommentChannelHref);
						const html = await response.text();
						// Initialize the DOM parser
						let parser = new DOMParser();

						// Parse the text
						var doc = parser.parseFromString(html, "text/html");

						// Get the channel name (Channel name - YouTube)
						const channelName = doc.title.split(" - ")[0];

						// Check if the comment is from the channel owner
						let isOwner = false;
						const channelOwnerCommentRendererH3 = comment.parentElement.parentElement.getElementsByTagName("H3")[0];
						const channelOwnerCommentChannelAnchor = channelOwnerCommentRendererH3.querySelector("A");
						if (channelOwnerCommentChannelAnchor) {
							const channelOwnerCommentSpan = channelOwnerCommentChannelAnchor.querySelector("span");
							if (channelOwnerCommentSpan && channelOwnerCommentSpan.classList.contains("channel-owner")) {
								// Set the channel name next to the ID with the owner badge
								const commentChannelID = 
									featuredCommentChannelIDFormattedString.textContent = channelName + " ( 👑 " + featuredCommentChannelIDFormattedString.textContent + " )";
								isOwner = true;
							}
						}

						if (!isOwner) {
							// Set the channel name next to the ID
							const commentChannelID = 
								featuredCommentChannelIDFormattedString.textContent = channelName + " ( 🙌 " + featuredCommentChannelIDFormattedString.textContent + " )";
						}
					}
				}
			});
		}
	}

	async observeForComments(comments) {
		if (comments.length > 0) {
			comments.forEach(async(comment) => {
				const commentRendererH3 = comment.querySelector("H3");
				const commentChannelAnchor = commentRendererH3.querySelector("A");
				if (commentChannelAnchor) {
					const commentChannelHref = commentChannelAnchor.getAttribute("href");
					const commentChannelIDSpan = commentChannelAnchor.querySelector("span");
					if (commentChannelIDSpan) {
						const response = await fetch("https://www.youtube.com/" + commentChannelHref);
						const html = await response.text();
						// Initialize the DOM parser
						let parser = new DOMParser();

						// Parse the text
						var doc = parser.parseFromString(html, "text/html");

						// Get the channel name (Channel name - YouTube)
						const channelName = doc.title.split(" - ")[0];

						// Set the channel name next to the ID
						const commentChannelID = commentChannelIDSpan.textContent;
						commentChannelIDSpan.textContent = channelName + " (" + commentChannelID + ")";
					}
				}
			});
		}
	}
}

// YouTube content-script
const observer = new YouTubeObserver();
(async () => {
	await observer.observe();
})();