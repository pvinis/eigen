import { ScreenOwnerType, tappedMainArtworkGrid } from "@artsy/cohesion"
import { Box, Flex, Sans, Spacer } from "@artsy/palette"
import { ArtworkGridItem_artwork } from "__generated__/ArtworkGridItem_artwork.graphql"
import OpaqueImageView from "lib/Components/OpaqueImageView/OpaqueImageView"
import SwitchBoard from "lib/NativeModules/SwitchBoard"
import { getUrgencyTag } from "lib/utils/getUrgencyTag"
import { PlaceholderBox, PlaceholderRaggedText, RandomNumberGenerator } from "lib/utils/placeholders"
import { Touchable } from "palette"
import React, { useRef } from "react"
import { StyleSheet, View } from "react-native"
import { createFragmentContainer, graphql } from "react-relay"
import { useTracking } from "react-tracking"

interface Props {
  artwork: ArtworkGridItem_artwork
  // If it's not provided, then it will push just the one artwork
  // to the switchboard.
  onPress?: (artworkID: string) => void
  trackingFlow?: string
  contextModule?: string
  // Pass Tap to override generic ing, used for home tracking in rails
  trackTap?: (artworkSlug: string, index?: number) => void
  itemIndex?: number
  // By default, we don't track clicks from the grid unless you pass in a contextScreenOwnerType.
  contextScreenOwnerType?: ScreenOwnerType
  contextScreenOwnerId?: string
  contextScreenOwnerSlug?: string
}

export const Artwork: React.FC<Props> = ({
  artwork,
  onPress,
  trackTap,
  itemIndex,
  contextScreenOwnerId,
  contextScreenOwnerSlug,
  contextScreenOwnerType,
}) => {
  const itemRef = useRef<any>()
  const tracking = useTracking()

  const handleTap = () => {
    trackArtworkTap()
    onPress && artwork.slug
      ? onPress(artwork.slug)
      : SwitchBoard.presentNavigationViewController(
          itemRef.current!,
          // @ts-ignore STRICTNESS_MIGRATION
          artwork.href
        )
  }

  const trackArtworkTap = () => {
    // Unless you explicitly pass in a tracking function or provide a contextScreenOwnerType, we won't track
    // taps from the grid.
    if (trackTap || contextScreenOwnerType) {
      const genericTapEvent = tappedMainArtworkGrid({
        contextScreenOwnerType: contextScreenOwnerType!,
        contextScreenOwnerId,
        contextScreenOwnerSlug,
        destinationScreenOwnerId: artwork.internalID,
        destinationScreenOwnerSlug: artwork.slug,
      })

      trackTap ? trackTap(artwork.slug, itemIndex) : tracking.trackEvent(genericTapEvent)
    }
  }

  const saleInfo = saleMessageOrBidInfo({ artwork })

  const urgencyTag = getUrgencyTag(artwork?.sale?.endAt)

  return (
    <Touchable onPress={() => handleTap()}>
      <View ref={itemRef}>
        {!!artwork.image && (
          <OpaqueImageView
            aspectRatio={artwork.image?.aspectRatio ?? 1}
            imageURL={artwork.image?.url}
            style={styles.artworkImage}
          >
            {Boolean(urgencyTag && artwork?.sale?.isAuction && !artwork?.sale?.isClosed) && (
              <Flex backgroundColor="white" px="5px" py="3px" borderRadius={2} alignSelf="flex-start">
                <Sans size="2" color="black100" numberOfLines={1}>
                  {urgencyTag}
                </Sans>
              </Flex>
            )}
          </OpaqueImageView>
        )}
        <Box mt={1}>
          {!!artwork.artistNames && (
            <Sans size="3t" weight="medium" numberOfLines={1}>
              {artwork.artistNames}
            </Sans>
          )}
          {!!artwork.title && (
            <Sans size="3t" color="black60" numberOfLines={1}>
              {artwork.title}
              {!!artwork.date && `, ${artwork.date}`}
            </Sans>
          )}
          {!!artwork.partner?.name && (
            <Sans size="3t" color="black60" numberOfLines={1}>
              {artwork.partner.name}
            </Sans>
          )}
          {!!saleInfo && (
            <Sans color="black60" size="3t" numberOfLines={1}>
              {saleInfo}
            </Sans>
          )}
        </Box>
      </View>
    </Touchable>
  )
}

/**
 * Get sale message or bid info
 * @example
 * "$1,000 (Starting price)"
 * @example
 * "Bidding closed"
 *  @example
 * "$1,750 (2 bids)"
 */
export const saleMessageOrBidInfo = ({
  artwork,
  isSmallTile = false,
}: {
  artwork: Readonly<{
    sale: { isAuction: boolean | null; isClosed: boolean | null } | null
    saleArtwork: {
      counts: { bidderPositions: number | null } | null | null
      currentBid: { display: string | null } | null
    } | null
    saleMessage: string | null
  }>
  isSmallTile?: boolean
}): string | null | undefined => {
  const { sale, saleArtwork } = artwork

  // Auction specs are available at https://artsyproduct.atlassian.net/browse/MX-482
  if (sale?.isAuction) {
    // The auction is closed
    if (sale.isClosed) {
      return "Bidding closed"
    }

    // The auction is open
    const bidderPositions = saleArtwork?.counts?.bidderPositions
    const currentBid = saleArtwork?.currentBid?.display
    // If there are no current bids we show the starting price with an indication that it's a new bid
    if (!bidderPositions) {
      if (isSmallTile) {
        return `${currentBid} (Bid)`
      }
      return `${currentBid} (Starting price)`
    }

    // If there are bids we show the current bid price and the number of bids
    const numberOfBidsString = bidderPositions === 1 ? "1 bid" : `${bidderPositions} Bids`
    return `${currentBid} (${numberOfBidsString})`
  }

  if (artwork.saleMessage === "Contact For Price") {
    return "Contact for price"
  }

  return artwork.saleMessage
}

const styles = StyleSheet.create({
  artworkImage: {
    justifyContent: "flex-end",
    paddingHorizontal: 5,
    paddingBottom: 5,
  },

  endingDateContainer: {
    backgroundColor: "white",
    borderRadius: 2,
    paddingHorizontal: 5,
    minWidth: 100,
    paddingVertical: 3,
  },
})
export default createFragmentContainer(Artwork, {
  artwork: graphql`
    fragment ArtworkGridItem_artwork on Artwork {
      title
      date
      saleMessage
      slug
      internalID
      artistNames
      href
      sale {
        isAuction
        isClosed
        displayTimelyAt
        endAt
      }
      saleArtwork {
        counts {
          bidderPositions
        }
        currentBid {
          display
        }
      }
      partner {
        name
      }
      image {
        url(version: "large")
        aspectRatio
      }
    }
  `,
})

export const ArtworkGridItemPlaceholder: React.FC<{ seed?: number }> = ({ seed = Math.random() }) => {
  const rng = new RandomNumberGenerator(seed)
  return (
    <Flex>
      <PlaceholderBox height={rng.next({ from: 50, to: 150 })} width="100%" />
      <Spacer mb="1" />
      <PlaceholderRaggedText seed={rng.next()} numLines={2} />
    </Flex>
  )
}
