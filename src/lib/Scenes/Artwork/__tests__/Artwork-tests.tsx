import { mount } from "enzyme"
import { ArtworkFixture } from "lib/__fixtures__/ArtworkFixture"
import React from "react"
import { RelayRefetchProp } from "react-relay"
import { useTracking } from "react-tracking"
import { Artwork } from "../Artwork"
import { ArtworkHeader } from "../Components/ArtworkHeader"

const trackEvent = jest.fn()

describe("Artwork", () => {
  beforeEach(() => {
    ;(useTracking as jest.Mock).mockImplementation(() => {
      return {
        trackEvent,
      }
    })
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it("renders a snapshot", () => {
    const component = mount(<Artwork artwork={ArtworkFixture} relay={{ environment: {} } as RelayRefetchProp} />)
    expect(component.find(ArtworkHeader).length).toEqual(1)
  })
})
