export const Platform = {
  OS: 'ios',
  select: (opts: Record<string, unknown>) => opts.ios,
};

export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

export const StyleSheet = {
  create: (styles: any) => styles,
  hairlineWidth: 0.5,
};

export const Alert = {
  alert: jest.fn(),
};

export const Dimensions = {
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
};
