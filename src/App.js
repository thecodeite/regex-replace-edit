import React, { Component } from 'react';
import './App.css';

// class BetterRegExp extends RegExp {
//   constructor(str, opt) {
//     super(str, opt);
//     this.str = str;
//     this.opt = opt;
//     this.splitRegExp = new RegExp(str);
//   }

//   [Symbol.split](str) {
//     console.log('Im splitting!');
//     let match;

//     const result = [];
//     while ((match = str.match(this.splitRegExp))) {
//       result.push(str.substr(0, match.index));
//       str = str.substr(match.index + match[0].length);
//     }
//     result.push(str);
//   }
// }

function doReplace(str, regex, replace) {
  //return str.split(regex);
  console.log('Im splitting!');
  let match;

  const result = [];
  let count = 0;
  while (
    count++ < 5 &&
    (match = str.match(regex)) &&
    match !== undefined &&
    match[0] !== undefined
  ) {
    result.push(str.substr(0, match.index));
    result.push(format(replace)(match));
    str = str.substr(match.index + match[0].length);
  }
  result.push(str);
  return result;
}

const prefix = 'regex-replace-';

function htmlEscape(text) {
  return text.replace(/[ \n"&<>]/g, match => {
    if (match === ' ') return '&nbsp;';
    if (match === '\n') return '<br />';
    if (match === '"') return '&quot;';
    if (match === '&') return '&amp;';
    if (match === '<') return '&lt;';
    if (match === '>') return '&gt;';
    return match;
  });
}

const format = replace => match => {
  console.log({ replace, match });

  return replace.replace(/\$([$&]|\d+|[ul]\d+)/g, (_, a) => {
    console.log('a:', a);
    if (a === '$') return '$';
    if (a === '&') return match[0];
    if (a.startsWith('u'))
      return (match[parseInt(a.substr(1), 10)] || '').toUpperCase();
    if (a.startsWith('l'))
      return (match[parseInt(a.substr(1), 10)] || '').toLowerCase();
    return match[parseInt(a, 10)] || '';
  });
};

class App extends Component {
  constructor() {
    super();
    this.state = this.load();
  }

  load() {
    const name = window.location.hash.substr(1) || 'default';
    const fromLocalStorage =
      JSON.parse(window.localStorage.getItem(prefix + name)) || {};
    const names = [...window.localStorage]
      .map((_, i) => localStorage.key(i))
      .filter(n => n.startsWith(prefix))
      .map(n => n.substr(prefix.length));

    return {
      search: fromLocalStorage.search || '',
      replace: fromLocalStorage.replace || '',
      text: fromLocalStorage.text || '',
      multiline: fromLocalStorage.multiline || false,
      ignoreCase: fromLocalStorage.ignoreCase || false,
      name,
      names
    };
  }

  componentDidMount() {
    window.addEventListener('hashchange', e => {
      console.log('hashchange');
      this.setState(this.load());
    });
  }

  delete(name) {
    window.localStorage.removeItem(prefix + name);
    this.setState(this.load());
  }

  render() {
    const {
      name,
      names,
      search,
      replace,
      text,
      multiline,
      ignoreCase
    } = this.state;
    const result = (() => {
      try {
        const option = `${multiline ? 'm' : ''}${ignoreCase ? 'i' : ''}`;
        const escaped = doReplace(text, new RegExp(search, option), replace)
          .map(htmlEscape)
          .reduce((acc, c, i) => {
            acc.push(c);
            acc.push(i % 2 ? '</r>' : '<r>');
            return acc;
          }, []);

        return escaped.join('');
      } catch (e) {
        return htmlEscape(e.toString());
      }
    })();
    const onChange = section => e => {
      const data = {
        search,
        replace,
        text,
        multiline,
        ignoreCase
      };
      data[section] = e.target.value;
      window.localStorage.setItem(prefix + name, JSON.stringify(data));
      this.setState(this.load());
    };
    const onChecked = section => e => {
      const data = {
        search,
        replace,
        text,
        multiline,
        ignoreCase
      };
      data[section] = e.target.checked;
      window.localStorage.setItem(prefix + name, JSON.stringify(data));
      this.setState(this.load());
    };
    return (
      <div className="App">
        <main>
          <header>
            {names.map(n => (
              <span key={n}>
                [<a href={`#${n}`}>{n}</a>{' '}
                <button onClick={() => this.delete(n)}>
                  <span role="img" aria-label={`delete ${name}`}>
                    ❌
                  </span>
                </button>
                ]{' '}
              </span>
            ))}
          </header>
          <h1>{name}</h1>
          <bar>
            Multiline:{' '}
            <input
              type="checkbox"
              checked={multiline}
              onChange={onChecked('multiline')}
            />
            IgnoreCase:{' '}
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={onChecked('ignoreCase')}
            />
          </bar>
          <div>
            <fieldset>
              <textarea value={search} onChange={onChange('search')} />
              <legend>Search</legend>
            </fieldset>
          </div>
          <div>
            <fieldset>
              <textarea value={replace} onChange={onChange('replace')} />
              <legend>Replace</legend>
            </fieldset>
          </div>
          <div>
            <fieldset>
              <textarea value={text} onChange={onChange('text')} />
              <legend>Before</legend>
            </fieldset>
          </div>
          <div>
            <fieldset>
              <div
                className="Preview"
                dangerouslySetInnerHTML={{ __html: result }}
              />
              <legend>After</legend>
            </fieldset>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
