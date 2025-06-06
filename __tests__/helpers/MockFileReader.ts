// Declare FileReader interface matching the browser API
interface FileReaderEventTarget extends EventTarget {
  result: string;
}

interface FileReaderEvent extends Event {
  target: FileReaderEventTarget;
}

// FileReader mock class that implements necessary methods for testing
export default class MockFileReader {
  readAsText: jest.Mock<void, [any]>;
  result: string;
  onload: ((event: FileReaderEvent) => void) | null;
  onerror: ((event: Event) => void) | null;

  constructor() {
    this.readAsText = jest.fn((file) => {
      // ここではイベントをトリガーしない
      // テストでmanuallyTriggerLoadEventを呼び出す
    });
    this.result = "";
    this.onload = null;
    this.onerror = null;
  }

  // テスト用のヘルパーメソッド - ファイル読み込み完了をシミュレート
  manuallyTriggerLoadEvent(result: string) {
    this.result = result;
    if (this.onload) {
      const event = new Event('load') as FileReaderEvent;
      (event as any).target = { result };
      this.onload(event);
    }
  }

  // エラーイベントをトリガーするヘルパーメソッド
  manuallyTriggerErrorEvent(error?: Error) {
    if (this.onerror) {
      const event = new Event('error');
      (event as any).error = error || new Error('File read error');
      this.onerror(event);
    }
  }
}

// 以下の関数は後方互換性のために残しておく
export interface FileReaderMock {
  readAsText: jest.Mock<void, [any]>;
  result: string;
  onload: ((event: FileReaderEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}

export function createMockFileReader(): FileReaderMock {
  return new MockFileReader();
}
