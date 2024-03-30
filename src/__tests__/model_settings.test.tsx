import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { ModelSettings } from "../components/model_settings";
import { Model, ModelProvider, ProviderConfig } from "../utils/config";

describe("ModelSettings Component", () => {
  beforeAll(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it("render Model Settings", async () => {
    const providerConfigs: Record<string, ProviderConfig> = {
      tesla: new ProviderConfig("tesla", true, "key1", ["model_3"]),
    };
    const setProviderConfigs = jest.fn();
    let customModels: Model[] = [new Model("tesla", "model_3", 4096)];
    let setCustomModels = jest.fn();
    let customProviders: ModelProvider[] = [
      new ModelProvider("Tesla", "OpenAI", "https://api.tesla.com", "tesla"),
    ];
    let setCustomProviders = jest.fn();
    render(
      <ModelSettings
        displayText={(text) => text}
        providerConfigs={providerConfigs}
        setProviderConfigs={setProviderConfigs}
        customModels={customModels}
        setCustomModels={setCustomModels}
        customProviders={customProviders}
        setCustomProviders={setCustomProviders}
      />
    );

    const openai = screen.getByTestId("provider_OpenAI");
    expect(within(openai).queryByText("OpenAI")).toBeInTheDocument();
    expect(within(openai).queryAllByRole("img")).toHaveLength(1);
    expect(within(openai).getByRole("switch")).not.toBeChecked();
    act(() => {
      fireEvent.click(within(openai).getByRole("switch"));
    });
    // expect(within(openai).getByRole("switch")).toBeChecked();

    const tesla = screen.getByTestId("provider_Tesla");
    const teslaHeader = within(tesla).getByTestId("providerHeader");
    expect(within(teslaHeader).queryByText("Tesla")).toBeInTheDocument();
    expect(within(teslaHeader).queryAllByRole("img")).toHaveLength(2);
    expect(within(teslaHeader).getByRole("switch")).toBeChecked();
    expect(within(tesla).queryByText("model_y")).toBeNull();
    const model3 = within(tesla).getByTestId("model_model_3");
    expect(within(model3).queryByText("model_3")).toBeInTheDocument();
    expect(within(model3).getByRole("switch")).toBeChecked();
    expect(within(tesla).getByPlaceholderText("Tesla API Key")).toHaveValue("key1");
    act(() => {
      fireEvent.change(within(tesla).getByPlaceholderText("Tesla API Key"), {
        target: { value: "key2" },
      });
    });
    // expect(within(tesla).getByPlaceholderText("Tesla API Key")).toHaveValue("key2");

    expect(screen.queryByTestId("provider_Apple")).not.toBeInTheDocument();

    expect(screen.queryByTestId("providerModal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Add Provider"));
    const providerModal = screen.getByTestId("providerModal");
    expect(providerModal).toBeVisible();
    act(() => {
      fireEvent.click(within(providerModal).getByText(/Cancel/));
    });
    expect(within(providerModal).getByText(/Submit/)).not.toBeVisible();

    // fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Apple" } });
    // fireEvent.change(screen.getByLabelText(/Endpoint/), {
    //   target: { value: "https://api.apple.com" },
    // });
    // fireEvent.click(screen.getByText(/Submit/));
    // expect(screen.queryByTestId("provider_Apple")).toBeInTheDocument();
  });
});
