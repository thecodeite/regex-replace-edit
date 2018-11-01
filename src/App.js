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

function doReplace(str, regex, replace, removeUnmatched, maxMatches) {
  //return str.split(regex);
  //console.log('Im splitting!');
  let match;

  const result = [];
  let count = 0;
  while (
    count++ < maxMatches &&
    (match = str.match(regex)) &&
    match !== undefined &&
    match[0] !== undefined
  ) {
    if (!removeUnmatched) {
      result.push(str.substr(0, match.index));
    }
    result.push(format(replace)(match));
    str = str.substr(match.index + match[0].length);
  }
  if (!removeUnmatched) {
    result.push(str);
  }
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
  // console.log({ replace, match });

  return replace.replace(/\$([$&]|\d+|[ul]\d+)/g, (_, a) => {
    // console.log('a:', a);
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
      text: fromLocalStorage.text || '',
      tabs: fromLocalStorage.tabs || [{}],
      currentTab: fromLocalStorage.currentTab || 0,
      resultTabLocked: fromLocalStorage.resultTabLocked || false,
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
      text,
      tabs,
      currentTab,
      resultTabLocked
    } = this.state;

    const {
      search: search = '',
      replace: replace = '',
      multiline: multiline = false,
      ignoreCase: ignoreCase = false,
      removeUnmatched: removeUnmatched = false,
      maxMatches: maxMatches = 50
    } = tabs[currentTab]

    let result = text
    const last = (resultTabLocked ? tabs.length-1 : currentTab)
    for(let i=0; i<=last; i++) {
      result = (() => { 
        const {
          search: search = '',
          replace: replace = '',
          multiline: multiline = false,
          ignoreCase: ignoreCase = false,
          removeUnmatched: removeUnmatched = false,
          maxMatches: maxMatches = 50
        } = tabs[i]

        try {
          const option = `${multiline ? 'm' : ''}${ignoreCase ? 'i' : ''}`;
          const replaced = doReplace(
            result,
            new RegExp(search, option),
            replace,
            removeUnmatched,
            maxMatches
          )
          if (i < last) {
            return replaced.join('');
          }
          const escaped = replaced.map(htmlEscape);

          let highlighted;
          if (removeUnmatched) {
            highlighted = escaped;
          } else {
            highlighted = escaped.reduce((acc, c, i) => {
              acc.push(c);
              acc.push(i % 2 ? '</r>' : '<r>');
              return acc;
            }, []);
          }

          return highlighted.join('');
        } catch (e) {
          return htmlEscape(e.toString());
        }
      })();
    }
    const onChange = (section, writeToTab) => e => {
      const data = {
        text,
        tabs,
        currentTab,
        resultTabLocked
      };
      if (writeToTab !== undefined) {
        data.tabs[writeToTab][section] = e.target.value;
      } else {
        data[section] = e.target.value;
      }
      window.localStorage.setItem(prefix + name, JSON.stringify(data));
      this.setState(this.load());
    };
    const onChecked = (section, writeToTab) => e => {
      const data = {
        text,
        tabs,
        currentTab,
        resultTabLocked
      };
      if (writeToTab !== undefined) {
        data.tabs[writeToTab][section] = e.target.checked;
      } else {
        data[section] = e.target.checked;
      }
      window.localStorage.setItem(prefix + name, JSON.stringify(data));
      this.setState(this.load());
    };

    const tab = (action) => {
      const data = {
        text,
        tabs,
        currentTab,
        resultTabLocked
      };
  
      if (action === 'add') {
        data.currentTab = tabs.length;
        tabs.push({})
      } else {
        data.currentTab = action
      }
  
      window.localStorage.setItem(prefix + name, JSON.stringify(data));
      this.setState(this.load());
    }

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
          <div className='tabs'>
            Tabs: 
            {tabs.map((_, i) => <button key={i} onClick={() => tab(i)} className={i === currentTab ? 'active' : ''}>{i}</button>)}
            <button onClick={() => tab('add')}>+</button>
          </div>
          <div className="leftBar">
            <label>
              Multiline:{' '}
              <input
                type="checkbox"
                checked={multiline}
                onChange={onChecked('multiline', currentTab)}
              />
            </label>
            <label>
              IgnoreCase:{' '}
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={onChecked('ignoreCase', currentTab)}
                />
            </label>
          </div>
          <div className="rightBar">
            <label>
              Remove Unamtched:{' '}
              <input
                type="checkbox"
                checked={removeUnmatched}
                onChange={onChecked('removeUnmatched', currentTab)}
                />
            </label>
            <label>
              Max matches:{' '}
              <input
                type="numeric"
                width="32"
                value={maxMatches}
                onChange={onChecked('maxMatches', currentTab)}
                />
            </label>
          </div>

          <div>
            <fieldset>
              <textarea value={search} onChange={onChange('search', currentTab)} />
              <legend>Search</legend>
            </fieldset>
          </div>
          <div>
            <fieldset>
              <textarea value={replace} onChange={onChange('replace', currentTab)} />
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
              <div className='tabs'>
                {tabs.map((_, i) => <button key={i} onClick={() => 0} className={i === currentTab ? 'active' : ''} >{i}</button>)}
                <button onClick={() => onChange('resultTabLocked')({target:{value:!resultTabLocked}})} className={resultTabLocked ? 'active' : ''} >Lock</button>
                resultTabLocked:{resultTabLocked?'T':'F'}
              </div>
              <div className="Preview">
                <div
                  className="Preview-inner"
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              </div>
              <legend>After</legend>
            </fieldset>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
