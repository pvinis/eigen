import { fireEvent, screen } from "@testing-library/react-native"
import { __globalStoreTestUtils__ } from "app/store/GlobalStore"
import * as navigation from "app/system/navigation/navigate"
import { renderWithWrappers } from "app/utils/tests/renderWithWrappers"
import * as useSearchInsightsConfig from "app/utils/useSearchInsightsConfig"
import { Touchable } from "palette"
import { SearchHighlight } from "./SearchHighlight"
import { SearchResult } from "./SearchResult"

jest.mock("app/utils/useSearchInsightsConfig", () => ({
  searchInsights: jest.fn(),
}))
jest.mock("./SearchHighlight.tsx", () => ({ SearchHighlight: () => null }))

const initialResult = {
  href: "/test-href",
  image_url: "test-url",
  name: "Test Name",
  objectID: "test-id",
  slug: "test-slug",
  __position: 1,
  __queryID: "test-query-id",
}

const TestPage = (props: any) => {
  const { result, ...rest } = props
  return (
    <SearchResult
      categoryName="Article"
      result={{
        ...initialResult,
        ...result,
      }}
      selectedPill={{
        indexName: "Article_staging",
        displayName: "Article",
        disabled: false,
      }}
      {...rest}
    />
  )
}

describe("SearchListItem", () => {
  const getRecentSearches = () => __globalStoreTestUtils__?.getCurrentState().search.recentSearches!

  const navigateSpy = jest.spyOn(navigation, "navigate")

  const searchInsightsSpy = jest.spyOn(useSearchInsightsConfig, "searchInsights")

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    __globalStoreTestUtils__?.reset()
  })

  it("renders image with correct props", () => {
    renderWithWrappers(<TestPage />)

    const searchResultImage = screen.getByTestId("search-result-image")
    expect(searchResultImage).toBeOnTheScreen()

    expect(searchResultImage).toHaveProp("imageURL", "test-url")
  })

  it("renders highlight with correct props", () => {
    renderWithWrappers(<TestPage />)
    const highlight = screen.UNSAFE_getByType(SearchHighlight)

    expect(highlight).toBeDefined()
    expect(highlight.props.attribute).toEqual("name")
    expect(highlight.props.hit).toEqual(initialResult)
  })

  it("calls searchInsights with correct params on press", () => {
    renderWithWrappers(<TestPage />)

    fireEvent.press(screen.UNSAFE_getByType(Touchable))
    expect(searchInsightsSpy).toHaveBeenCalledWith("clickedObjectIDsAfterSearch", {
      index: "Article_staging",
      eventName: "Search item clicked",
      positions: [1],
      queryID: "test-query-id",
      objectIDs: ["test-id"],
    })
  })

  it("when a result is pressed, correctly adds it to global recent searches", () => {
    renderWithWrappers(<TestPage />)

    fireEvent.press(screen.UNSAFE_getByType(Touchable))

    expect(getRecentSearches()).toEqual([
      {
        type: "AUTOSUGGEST_RESULT_TAPPED",
        props: {
          imageUrl: "test-url",
          href: "/test-href",
          slug: "test-slug",
          displayLabel: "Test Name",
          __typename: "Article",
          displayType: "Article",
        },
      },
    ])
  })

  it(`calls navigation.navigate with href on press when href does not start with "/partner"`, () => {
    renderWithWrappers(<TestPage />)

    fireEvent.press(screen.UNSAFE_getByType(Touchable))
    expect(navigateSpy).toHaveBeenCalledWith("/test-href")
  })
})
