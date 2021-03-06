import './_helpers/setupAdapters';
import React from 'react';
import { expect } from 'chai';

import { REACT013, REACT16 } from './_helpers/version';
import configuration from 'enzyme/build/configuration';
import { itIf, describeWithDOM } from './_helpers';

const { adapter } = configuration.get();

const prettyFormat = o => JSON.stringify(o, null, 2);

// Kind of hacky, but we nullify all the instances to test the tree structure
// with jasmine's deep equality function, and test the instances separate. We
// also delete children props because testing them is more annoying and not
// really important to verify.
function cleanNode(node) {
  if (!node) {
    return;
  }
  if (node && node.instance) {
    node.instance = null;
  }
  if (node && node.props && node.props.children) {
    // eslint-disable-next-line no-unused-vars
    const { children, ...props } = node.props;
    node.props = props;
  }
  if (Array.isArray(node.rendered)) {
    node.rendered.forEach(cleanNode);
  } else if (typeof node.rendered === 'object') {
    cleanNode(node.rendered);
  }
}

describe('Adapter', () => {
  describeWithDOM('mounted render', () => {
    it('treats mixed children correctlyf', () => {
      class Foo extends React.Component {
        render() {
          return (
            <div>hello{4}{'world'}</div>
          );
        }
      }

      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      renderer.render(<Foo />);

      const node = renderer.getNode();

      cleanNode(node);

      expect(prettyFormat(node)).to.equal(prettyFormat({
        nodeType: 'class',
        type: Foo,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: {
          nodeType: 'host',
          type: 'div',
          props: {},
          key: null,
          ref: null,
          instance: null,
          rendered: [
            'hello',
            REACT16 ? '4' : 4,
            'world',
          ],
        },
      }));
    });

    it('treats null renders correctly', () => {
      class Foo extends React.Component {
        render() {
          return null;
        }
      }

      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      renderer.render(<Foo />);

      const node = renderer.getNode();

      cleanNode(node);

      expect(prettyFormat(node)).to.equal(prettyFormat({
        nodeType: 'class',
        type: Foo,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: null,
      }));
    });

    itIf(!REACT013, 'renders simple components returning host components', () => {
      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      const Qoo = () => <span className="Qoo">Hello World!</span>;

      renderer.render(<Qoo />);

      const node = renderer.getNode();

      cleanNode(node);

      expect(prettyFormat(node)).to.equal(prettyFormat({
        nodeType: 'function',
        type: Qoo,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: {
          nodeType: 'host',
          type: 'span',
          props: { className: 'Qoo' },
          key: null,
          ref: null,
          instance: null,
          rendered: ['Hello World!'],
        },
      }));
    });

    it('renders simple components returning host components', () => {
      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      class Qoo extends React.Component {
        render() {
          return (
            <span className="Qoo">Hello World!</span>
          );
        }
      }

      renderer.render(<Qoo />);

      const node = renderer.getNode();

      cleanNode(node);

      expect(prettyFormat(node)).to.equal(prettyFormat({
        nodeType: 'class',
        type: Qoo,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: {
          nodeType: 'host',
          type: 'span',
          props: { className: 'Qoo' },
          key: null,
          ref: null,
          instance: null,
          rendered: ['Hello World!'],
        },
      }));
    });

    it('handles null rendering components', () => {
      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      class Foo extends React.Component {
        render() {
          return null;
        }
      }

      renderer.render(<Foo />);

      const node = renderer.getNode();

      expect(node.instance).to.be.instanceof(Foo);

      cleanNode(node);

      expect(prettyFormat(node)).to.equal(prettyFormat({
        nodeType: 'class',
        type: Foo,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: null,
      }));
    });


    itIf(!REACT013, 'renders complicated trees of composites and hosts', () => {
      // SFC returning host. no children props.
      const Qoo = () => <span className="Qoo">Hello World!</span>;

      // SFC returning host. passes through children.
      const Foo = ({ className, children }) => (
        <div className={`Foo ${className}`}>
          <span className="Foo2">Literal</span>
          {children}
        </div>
      );

      // class composite returning composite. passes through children.
      class Bar extends React.Component {
        render() {
          const { special, children } = this.props;
          return (
            <Foo className={special ? 'special' : 'normal'}>
              {children}
            </Foo>
          );
        }
      }

      // class composite return composite. no children props.
      class Bam extends React.Component {
        render() {
          return (
            <Bar special>
              <Qoo />
            </Bar>
          );
        }
      }

      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      renderer.render(<Bam />);

      const tree = renderer.getNode();

      // we test for the presence of instances before nulling them out
      expect(tree.instance).to.be.instanceof(Bam);
      expect(tree.rendered.instance).to.be.instanceof(Bar);

      cleanNode(tree);

      expect(prettyFormat(tree)).to.equal(
        prettyFormat({
          nodeType: 'class',
          type: Bam,
          props: {},
          key: null,
          ref: null,
          instance: null,
          rendered: {
            nodeType: 'class',
            type: Bar,
            props: { special: true },
            key: null,
            ref: null,
            instance: null,
            rendered: {
              nodeType: 'function',
              type: Foo,
              props: { className: 'special' },
              key: null,
              ref: null,
              instance: null,
              rendered: {
                nodeType: 'host',
                type: 'div',
                props: { className: 'Foo special' },
                key: null,
                ref: null,
                instance: null,
                rendered: [
                  {
                    nodeType: 'host',
                    type: 'span',
                    props: { className: 'Foo2' },
                    key: null,
                    ref: null,
                    instance: null,
                    rendered: ['Literal'],
                  },
                  {
                    nodeType: 'function',
                    type: Qoo,
                    props: {},
                    key: null,
                    ref: null,
                    instance: null,
                    rendered: {
                      nodeType: 'host',
                      type: 'span',
                      props: { className: 'Qoo' },
                      key: null,
                      ref: null,
                      instance: null,
                      rendered: ['Hello World!'],
                    },
                  },
                ],
              },
            },
          },
        }),
      );
    });

    it('renders complicated trees of composites and hosts', () => {
      // class returning host. no children props.
      class Qoo extends React.Component {
        render() {
          return (
            <span className="Qoo">Hello World!</span>
          );
        }
      }

      class Foo extends React.Component {
        render() {
          const { className, children } = this.props;
          return (
            <div className={`Foo ${className}`}>
              <span className="Foo2">Literal</span>
              {children}
            </div>
          );
        }
      }

      // class composite returning composite. passes through children.
      class Bar extends React.Component {
        render() {
          const { special, children } = this.props;
          return (
            <Foo className={special ? 'special' : 'normal'}>
              {children}
            </Foo>
          );
        }
      }

      // class composite return composite. no children props.
      class Bam extends React.Component {
        render() {
          return (
            <Bar special>
              <Qoo />
            </Bar>
          );
        }
      }

      const options = { mode: 'mount' };
      const renderer = adapter.createRenderer(options);

      renderer.render(<Bam />);

      const tree = renderer.getNode();

      // we test for the presence of instances before nulling them out
      expect(tree.instance).to.be.instanceof(Bam);
      expect(tree.rendered.instance).to.be.instanceof(Bar);

      cleanNode(tree);

      expect(prettyFormat(tree)).to.equal(
        prettyFormat({
          nodeType: 'class',
          type: Bam,
          props: {},
          key: null,
          ref: null,
          instance: null,
          rendered: {
            nodeType: 'class',
            type: Bar,
            props: { special: true },
            key: null,
            ref: null,
            instance: null,
            rendered: {
              nodeType: 'class',
              type: Foo,
              props: { className: 'special' },
              key: null,
              ref: null,
              instance: null,
              rendered: {
                nodeType: 'host',
                type: 'div',
                props: { className: 'Foo special' },
                key: null,
                ref: null,
                instance: null,
                rendered: [
                  {
                    nodeType: 'host',
                    type: 'span',
                    props: { className: 'Foo2' },
                    key: null,
                    ref: null,
                    instance: null,
                    rendered: ['Literal'],
                  },
                  {
                    nodeType: 'class',
                    type: Qoo,
                    props: {},
                    key: null,
                    ref: null,
                    instance: null,
                    rendered: {
                      nodeType: 'host',
                      type: 'span',
                      props: { className: 'Qoo' },
                      key: null,
                      ref: null,
                      instance: null,
                      rendered: ['Hello World!'],
                    },
                  },
                ],
              },
            },
          },
        }),
      );
    });
  });

  it('renders basic shallow as well', () => {
    // eslint-disable-next-line react/require-render-return
    class Bar extends React.Component {
      constructor(props) {
        super(props);
        throw new Error('Bar constructor should not be called');
      }
      render() {
        throw new Error('Bar render method should not be called');
      }
    }

    // eslint-disable-next-line react/require-render-return
    class Foo extends React.Component {
      render() {
        throw new Error('Foo render method should not be called');
      }
    }

    // class composite return composite. no children props.
    class Bam extends React.Component {
      render() {
        return (
          <Bar>
            <Foo />
            <Foo />
            <Foo />
          </Bar>
        );
      }
    }

    const options = { mode: 'shallow' };
    const renderer = adapter.createRenderer(options);

    renderer.render(<Bam />);

    const tree = renderer.getNode();

    cleanNode(tree);

    expect(prettyFormat(tree)).to.equal(
      prettyFormat({
        nodeType: 'class',
        type: Bam,
        props: {},
        key: null,
        ref: null,
        instance: null,
        rendered: {
          nodeType: 'class',
          type: Bar,
          props: {},
          key: null,
          ref: null,
          instance: null,
          rendered: [
            {
              nodeType: 'class',
              type: Foo,
              props: {},
              key: null,
              ref: null,
              instance: null,
              rendered: null,
            },
            {
              nodeType: 'class',
              type: Foo,
              props: {},
              key: null,
              ref: null,
              instance: null,
              rendered: null,
            },
            {
              nodeType: 'class',
              type: Foo,
              props: {},
              key: null,
              ref: null,
              instance: null,
              rendered: null,
            },
          ],
        },
      }),
    );
  });

});
